import { mergeByUpdatedAt } from "../core/syncMerge.js";
import { nowKey, today } from "../core/date.js";
import { calcMonthlyPayment, loanMonths } from "../core/financial.js";
import { BUDGET_ACTIONS } from "./actions.js";

export const DATA_VERSION = 3;

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const ensureMonth = (state, monthKey) => {
  const current = state.months?.[monthKey];
  if (current) return current;
  return { exp: [], charges: [] };
};

const firstDayFromMonthKey = monthKey => `${String(monthKey || "")}-01`;

const normalizeSavingsAccount = account => {
  if (!account) return account;
  const openingBalance = Number(account.openingBalance ?? account.balance ?? 0);
  return {
    ...account,
    openingBalance,
    movements: Array.isArray(account.movements) ? account.movements : [],
    objectives: Array.isArray(account.objectives) ? account.objectives : []
  };
};

const migrateState = input => {
  if (!input) return input;
  const savings = (input.savings || []).map(normalizeSavingsAccount);
  return {
    ...input,
    savings,
    activeMonth: input.activeMonth || nowKey(),
    dataVersion: Math.max(Number(input.dataVersion || 0), DATA_VERSION)
  };
};

const toRecord = value => ({
  exists: value != null,
  deleted: !!value?.deleted,
  updatedAt: Number(value?.updatedAt || 0),
  value
});

const mergeByIdUpdatedAt = (localItems = [], cloudItems = []) => {
  const localMap = new Map(localItems.map(i => [i.id, i]));
  const cloudMap = new Map(cloudItems.map(i => [i.id, i]));
  const ids = new Set([...localMap.keys(), ...cloudMap.keys()]);
  const result = [];

  for (const id of ids) {
    const local = localMap.get(id);
    const cloud = cloudMap.get(id);
    if (!local) {
      if (!cloud?.deleted) result.push(cloud);
      continue;
    }
    if (!cloud) {
      if (!local?.deleted) result.push(local);
      continue;
    }

    const merged = mergeByUpdatedAt({ local: toRecord(local), cloud: toRecord(cloud), preferOnEqual: "cloud" });
    if (!merged.record.deleted) result.push(merged.record.value);
  }

  return result;
};

const mergeBudgetStatesUpdatedAt = (localState, cloudState) => {
  const local = migrateState(localState);
  const cloud = migrateState(cloudState);

  const mergedLoans = mergeByIdUpdatedAt(local.loans || [], cloud.loans || []);
  const mergedInvestments = mergeByIdUpdatedAt(local.investments || [], cloud.investments || []);

  const localSavings = (local.savings || []).map(normalizeSavingsAccount);
  const cloudSavings = (cloud.savings || []).map(normalizeSavingsAccount);
  const mergedSavings = mergeByIdUpdatedAt(localSavings, cloudSavings).map(acc => {
    const localAcc = localSavings.find(a => a.id === acc.id);
    const cloudAcc = cloudSavings.find(a => a.id === acc.id);
    return {
      ...acc,
      movements: mergeByIdUpdatedAt(localAcc?.movements || [], cloudAcc?.movements || []),
      objectives: mergeByIdUpdatedAt(localAcc?.objectives || [], cloudAcc?.objectives || [])
    };
  });

  const localMonths = local.months || {};
  const cloudMonths = cloud.months || {};
  const monthKeys = new Set([...Object.keys(localMonths), ...Object.keys(cloudMonths)]);
  const mergedMonths = {};

  for (const key of monthKeys) {
    const lm = localMonths[key] || {};
    const cm = cloudMonths[key] || {};
    mergedMonths[key] = {
      ...lm,
      ...cm,
      exp: mergeByIdUpdatedAt(lm.exp || [], cm.exp || []),
      charges: mergeByIdUpdatedAt(lm.charges || [], cm.charges || [])
    };
  }

  return {
    ...local,
    ...cloud,
    cfg: { ...(local.cfg || {}), ...(cloud.cfg || {}) },
    months: mergedMonths,
    loans: mergedLoans,
    savings: mergedSavings,
    investments: mergedInvestments,
    dataVersion: Math.max(Number(local.dataVersion || 0), Number(cloud.dataVersion || 0), DATA_VERSION)
  };
};

export function budgetReducer(state, action) {
  switch (action.type) {
    case BUDGET_ACTIONS.HYDRATE_FROM_STORAGE: {
      const hydrated = migrateState(action.payload?.state || null);
      return hydrated;
    }
    case BUDGET_ACTIONS.IMPORT_BUDGET: {
      const mode = action.payload?.mode || "replace";
      const imported = migrateState(action.payload?.data || null);
      if (!imported) return state;
      if (mode === "merge" && state) {
        return mergeBudgetStatesUpdatedAt(state, imported);
      }
      return imported;
    }
    case BUDGET_ACTIONS.MERGE_FROM_CLOUD: {
      if (!state) return state;
      const cloudState = action.payload?.cloudState;
      const strategy = action.payload?.strategy || "updatedAt";
      if (!cloudState) return state;
      if (strategy === "updatedAt") return mergeBudgetStatesUpdatedAt(state, cloudState);
      return state;
    }
    case BUDGET_ACTIONS.RESET_FOYER: {
      if (!state) return state;
      return {
        ...state,
        months: {},
        loans: [],
        savings: [],
        investments: []
      };
    }
    case BUDGET_ACTIONS.MIGRATE_DATA_VERSION: {
      if (!state) return state;
      return { ...state, dataVersion: Number(action.payload?.dataVersion || state.dataVersion || DATA_VERSION) };
    }
    case BUDGET_ACTIONS.SET_ACTIVE_MONTH: {
      if (!state) return state;
      const month = action.payload?.month;
      if (!month) return state;
      return { ...state, activeMonth: month };
    }
    case BUDGET_ACTIONS.CREATE_MONTH: {
      if (!state) return state;
      const { monthKey, monthData } = action.payload || {};
      if (!monthKey || !monthData || state.months?.[monthKey]) return state;
      return {
        ...state,
        activeMonth: monthKey,
        months: { ...(state.months || {}), [monthKey]: monthData }
      };
    }
    case BUDGET_ACTIONS.SET_THEME_MODE: {
      if (!state) return state;
      const mode = action.payload?.mode;
      return { ...state, cfg: { ...(state.cfg || {}), dark: mode } };
    }
    case BUDGET_ACTIONS.UPSERT_CATEGORY: {
      if (!state) return state;
      const category = action.payload?.category;
      if (!category?.name) return state;
      const categories = [...(state.cfg?.categories || [])];
      const idx = category.id ? categories.findIndex(c => c.id === category.id) : -1;
      const ts = today();
      if (idx >= 0) {
        categories[idx] = { ...categories[idx], ...category, updatedAt: ts };
      } else {
        categories.push({ ...category, id: category.id || generateId(), o: category.o ?? categories.length, createdAt: ts, updatedAt: ts });
      }
      return { ...state, cfg: { ...(state.cfg || {}), categories } };
    }
    case BUDGET_ACTIONS.DELETE_CATEGORY: {
      if (!state) return state;
      const categoryId = action.payload?.categoryId;
      if (!categoryId) return state;
      return {
        ...state,
        cfg: {
          ...(state.cfg || {}),
          categories: (state.cfg?.categories || []).filter(c => c.id !== categoryId)
        }
      };
    }
    case BUDGET_ACTIONS.ARCHIVE_CATEGORY: {
      if (!state) return state;
      const categoryId = action.payload?.categoryId;
      if (!categoryId) return state;
      return {
        ...state,
        cfg: {
          ...(state.cfg || {}),
          categories: (state.cfg?.categories || []).map(c => (c.id === categoryId ? { ...c, ar: true, updatedAt: today() } : c))
        }
      };
    }
    case BUDGET_ACTIONS.ADD_PERSON: {
      if (!state) return state;
      const person = action.payload?.person;
      if (!person?.name) return state;
      return {
        ...state,
        cfg: {
          ...(state.cfg || {}),
          persons: [...(state.cfg?.persons || []), { ...person, id: person.id || generateId() }]
        }
      };
    }
    case BUDGET_ACTIONS.UPDATE_PERSON_NAME: {
      if (!state) return state;
      const { personId, name } = action.payload || {};
      if (!personId) return state;
      return {
        ...state,
        cfg: {
          ...(state.cfg || {}),
          persons: (state.cfg?.persons || []).map(p => (p.id === personId ? { ...p, name } : p))
        }
      };
    }
    case BUDGET_ACTIONS.SET_PERSON_TYPE: {
      if (!state) return state;
      const { personId, personType } = action.payload || {};
      if (!personId) return state;
      return {
        ...state,
        cfg: {
          ...(state.cfg || {}),
          persons: (state.cfg?.persons || []).map(p => (p.id === personId ? { ...p, type: personType } : p))
        }
      };
    }
    case BUDGET_ACTIONS.REMOVE_PERSON: {
      if (!state) return state;
      const personId = action.payload?.personId;
      if (!personId) return state;
      return {
        ...state,
        cfg: {
          ...(state.cfg || {}),
          persons: (state.cfg?.persons || []).filter(p => p.id !== personId)
        }
      };
    }
    case BUDGET_ACTIONS.SAVE_MONTH_SIMULATION: {
      if (!state) return state;
      const { monthKey, monthData } = action.payload || {};
      if (!monthKey || !monthData) return state;
      const ts = today();
      const allocByPerson = monthData.alloc || {};
      const savingsById = new Map((state.savings || []).map(a => [a.id, a]));
      const incomingByAccount = new Map();

      for (const [contributorId, alloc] of Object.entries(allocByPerson)) {
        const savEntries = alloc?.sav || [];
        for (const entry of savEntries) {
          const amount = Number(entry?.amount || 0);
          const accId = entry?.accId;
          if (!accId || amount <= 0) continue;
          if (!savingsById.has(accId)) continue;
          const list = incomingByAccount.get(accId) || [];
          list.push({ contributorId, amount });
          incomingByAccount.set(accId, list);
        }
      }

      const savings = (state.savings || []).map(account => {
        const baseMovements = (account.movements || []).filter(
          m => !(m?.source === "simulation" && m?.monthKey === monthKey)
        );
        const incoming = incomingByAccount.get(account.id) || [];
        if (incoming.length === 0) {
          if (baseMovements.length === (account.movements || []).length) return account;
          return { ...account, movements: baseMovements, updatedAt: ts };
        }
        const simMovements = incoming.map(item => ({
          id: generateId(),
          type: "credit",
          amount: Number(item.amount),
          date: firstDayFromMonthKey(monthKey),
          source: "simulation",
          monthKey,
          contributorId: item.contributorId,
          createdAt: ts,
          updatedAt: ts
        }));
        return {
          ...account,
          movements: [...baseMovements, ...simMovements],
          updatedAt: ts
        };
      });

      return {
        ...state,
        savings,
        months: {
          ...(state.months || {}),
          [monthKey]: monthData
        }
      };
    }
    case BUDGET_ACTIONS.ADD_EXPENSE: {
      if (!state) return state;
      const { monthKey, expense } = action.payload || {};
      if (!monthKey || !expense) return state;
      const month = ensureMonth(state, monthKey);
      const ts = today();
      const newExpense = {
        ...expense,
        id: expense.id || generateId(),
        createdAt: expense.createdAt || ts,
        updatedAt: ts
      };
      return {
        ...state,
        months: {
          ...state.months,
          [monthKey]: {
            ...month,
            exp: [...(month.exp || []), newExpense]
          }
        }
      };
    }
    case BUDGET_ACTIONS.UPDATE_EXPENSE: {
      if (!state) return state;
      const { monthKey, expenseId, patch } = action.payload || {};
      if (!monthKey || !expenseId || !patch) return state;
      const month = ensureMonth(state, monthKey);
      return {
        ...state,
        months: {
          ...state.months,
          [monthKey]: {
            ...month,
            exp: (month.exp || []).map(exp => (exp.id === expenseId ? { ...exp, ...patch, updatedAt: today() } : exp))
          }
        }
      };
    }
    case BUDGET_ACTIONS.DELETE_EXPENSE: {
      if (!state) return state;
      const { monthKey, expenseId } = action.payload || {};
      if (!monthKey || !expenseId) return state;
      const month = ensureMonth(state, monthKey);
      return {
        ...state,
        months: {
          ...state.months,
          [monthKey]: {
            ...month,
            exp: (month.exp || []).filter(exp => exp.id !== expenseId)
          }
        }
      };
    }
    case BUDGET_ACTIONS.ADD_FIXED_CHARGE: {
      if (!state) return state;
      const { monthKey, charge } = action.payload || {};
      if (!monthKey || !charge) return state;
      const month = ensureMonth(state, monthKey);
      const ts = today();
      const newCharge = {
        ...charge,
        id: charge.id || generateId(),
        auto: !!charge.auto,
        createdAt: charge.createdAt || ts,
        updatedAt: ts
      };
      return {
        ...state,
        months: {
          ...state.months,
          [monthKey]: {
            ...month,
            charges: [...(month.charges || []), newCharge]
          }
        }
      };
    }
    case BUDGET_ACTIONS.UPDATE_FIXED_CHARGE: {
      if (!state) return state;
      const { monthKey, chargeId, patch } = action.payload || {};
      if (!monthKey || !chargeId || !patch) return state;
      const month = ensureMonth(state, monthKey);
      return {
        ...state,
        months: {
          ...state.months,
          [monthKey]: {
            ...month,
            charges: (month.charges || []).map(charge => (charge.id === chargeId ? { ...charge, ...patch, updatedAt: today() } : charge))
          }
        }
      };
    }
    case BUDGET_ACTIONS.DELETE_FIXED_CHARGE: {
      if (!state) return state;
      const { monthKey, chargeId } = action.payload || {};
      if (!monthKey || !chargeId) return state;
      const month = ensureMonth(state, monthKey);
      return {
        ...state,
        months: {
          ...state.months,
          [monthKey]: {
            ...month,
            charges: (month.charges || []).filter(charge => charge.id !== chargeId)
          }
        }
      };
    }
    case BUDGET_ACTIONS.ADD_LOAN: {
      if (!state) return state;
      const { loan } = action.payload || {};
      if (!loan) return state;
      const ts = today();
      const monthKey = state.activeMonth || nowKey();
      const month = ensureMonth(state, monthKey);
      const computedMp = Number(
        loan.mp ??
          calcMonthlyPayment(
            Number(loan.cap || 0),
            Number(loan.rate || 0),
            loanMonths(loan.s, loan.e).t
          )
      );
      const autoCharge = {
        id: generateId(),
        name: loan.name || "Pret",
        amount: computedMp,
        freq: "monthly",
        lid: loan.id || undefined,
        auto: true,
        createdAt: ts,
        updatedAt: ts
      };
      const newLoan = {
        ...loan,
        id: loan.id || generateId(),
        createdAt: loan.createdAt || ts,
        updatedAt: ts
      };
      return {
        ...state,
        loans: [...(state.loans || []), newLoan],
        months: {
          ...(state.months || {}),
          [monthKey]: {
            ...month,
            charges: [...(month.charges || []), { ...autoCharge, lid: newLoan.id }]
          }
        }
      };
    }
    case BUDGET_ACTIONS.UPDATE_LOAN: {
      if (!state) return state;
      const { loanId, patch } = action.payload || {};
      if (!loanId || !patch) return state;
      return {
        ...state,
        loans: (state.loans || []).map(loan => (loan.id === loanId ? { ...loan, ...patch, updatedAt: today() } : loan))
      };
    }
    case BUDGET_ACTIONS.DELETE_LOAN: {
      if (!state) return state;
      const { loanId } = action.payload || {};
      if (!loanId) return state;
      return {
        ...state,
        loans: (state.loans || []).filter(loan => loan.id !== loanId)
      };
    }
    case BUDGET_ACTIONS.APPLY_EXTRA_PAYMENT: {
      if (!state) return state;
      const { loanId, amount } = action.payload || {};
      const payment = Number(amount || 0);
      if (!loanId || !payment || payment <= 0) return state;
      return {
        ...state,
        loans: (state.loans || []).map(loan =>
          loan.id === loanId ? { ...loan, cap: Math.max(0, Number(loan.cap || 0) - payment), updatedAt: today() } : loan
        )
      };
    }
    case BUDGET_ACTIONS.ADD_SAVINGS_ACCOUNT: {
      if (!state) return state;
      const { account } = action.payload || {};
      if (!account) return state;
      const ts = today();
      const newAccount = {
        ...account,
        id: account.id || generateId(),
        openingBalance: Number(account.openingBalance ?? account.balance ?? 0),
        movements: Array.isArray(account.movements) ? account.movements : [],
        objectives: Array.isArray(account.objectives) ? account.objectives : [],
        createdAt: account.createdAt || ts,
        updatedAt: ts
      };
      return {
        ...state,
        savings: [...(state.savings || []), newAccount]
      };
    }
    case BUDGET_ACTIONS.UPDATE_SAVINGS_ACCOUNT_METADATA: {
      if (!state) return state;
      const { accountId, patch } = action.payload || {};
      if (!accountId || !patch) return state;
      return {
        ...state,
        savings: (state.savings || []).map(account =>
          account.id === accountId
            ? {
                ...account,
                name: patch.name ?? account.name,
                type: patch.type ?? account.type,
                pid: patch.pid ?? account.pid,
                openingBalance:
                  patch.openingBalance != null
                    ? Number(patch.openingBalance)
                    : account.openingBalance,
                ar: patch.ar ?? account.ar,
                updatedAt: today()
              }
            : account
        )
      };
    }
    case BUDGET_ACTIONS.DELETE_SAVINGS_ACCOUNT: {
      if (!state) return state;
      const { accountId } = action.payload || {};
      if (!accountId) return state;
      return {
        ...state,
        savings: (state.savings || []).filter(account => account.id !== accountId)
      };
    }
    case BUDGET_ACTIONS.ADD_SAVINGS_MOVEMENT: {
      if (!state) return state;
      const { accountId, movement } = action.payload || {};
      if (!accountId || !movement) return state;
      const ts = today();
      const normalizedMovement = {
        ...movement,
        id: movement.id || generateId(),
        amount: Number(movement.amount || 0),
        type: movement.type || "credit",
        createdAt: movement.createdAt || ts,
        updatedAt: ts
      };
      return {
        ...state,
        savings: (state.savings || []).map(account =>
          account.id === accountId
            ? {
                ...account,
                movements: [...(account.movements || []), normalizedMovement],
                updatedAt: ts
              }
            : account
        )
      };
    }
    case BUDGET_ACTIONS.UPDATE_SAVINGS_MOVEMENT: {
      if (!state) return state;
      const { accountId, movementId, patch } = action.payload || {};
      if (!accountId || !movementId || !patch) return state;
      const ts = today();
      return {
        ...state,
        savings: (state.savings || []).map(account => {
          if (account.id !== accountId) return account;
          return {
            ...account,
            movements: (account.movements || []).map(m =>
              m.id === movementId
                ? {
                    ...m,
                    ...patch,
                    amount: patch.amount != null ? Number(patch.amount) : m.amount,
                    updatedAt: ts
                  }
                : m
            ),
            updatedAt: ts
          };
        })
      };
    }
    case BUDGET_ACTIONS.DELETE_SAVINGS_MOVEMENT: {
      if (!state) return state;
      const { accountId, movementId } = action.payload || {};
      if (!accountId || !movementId) return state;
      const ts = today();
      return {
        ...state,
        savings: (state.savings || []).map(account =>
          account.id === accountId
            ? {
                ...account,
                movements: (account.movements || []).filter(m => m.id !== movementId),
                updatedAt: ts
              }
            : account
        )
      };
    }
    case BUDGET_ACTIONS.ADD_SAVINGS_OBJECTIVE: {
      if (!state) return state;
      const { accountId, objective } = action.payload || {};
      if (!accountId || !objective) return state;
      const ts = today();
      const newObjective = {
        ...objective,
        id: objective.id || generateId(),
        createdAt: objective.createdAt || ts,
        updatedAt: ts
      };
      return {
        ...state,
        savings: (state.savings || []).map(account =>
          account.id === accountId
            ? {
                ...account,
                objectives: [...(account.objectives || []), newObjective],
                updatedAt: ts
              }
            : account
        )
      };
    }
    case BUDGET_ACTIONS.ADD_INVESTMENT_ACCOUNT: {
      if (!state) return state;
      const { account } = action.payload || {};
      if (!account) return state;
      const ts = today();
      const newAccount = {
        ...account,
        id: account.id || generateId(),
        snapshots: Array.isArray(account.snapshots) ? account.snapshots : [],
        createdAt: account.createdAt || ts,
        updatedAt: ts
      };
      return {
        ...state,
        investments: [...(state.investments || []), newAccount]
      };
    }
    case BUDGET_ACTIONS.UPDATE_INVESTMENT_ACCOUNT: {
      if (!state) return state;
      const { accountId, patch } = action.payload || {};
      if (!accountId || !patch) return state;
      return {
        ...state,
        investments: (state.investments || []).map(acc => (acc.id === accountId ? { ...acc, ...patch, updatedAt: today() } : acc))
      };
    }
    case BUDGET_ACTIONS.ARCHIVE_INVESTMENT_ACCOUNT: {
      if (!state) return state;
      const accountId = action.payload?.accountId;
      if (!accountId) return state;
      return {
        ...state,
        investments: (state.investments || []).map(acc => (acc.id === accountId ? { ...acc, ar: true, updatedAt: today() } : acc))
      };
    }
    case BUDGET_ACTIONS.DELETE_INVESTMENT_ACCOUNT: {
      if (!state) return state;
      const accountId = action.payload?.accountId;
      if (!accountId) return state;
      return {
        ...state,
        investments: (state.investments || []).filter(acc => acc.id !== accountId)
      };
    }
    case BUDGET_ACTIONS.ADD_INVESTMENT_SNAPSHOT: {
      if (!state) return state;
      const { accountId, snapshot } = action.payload || {};
      if (!accountId || !snapshot) return state;
      const ts = today();
      const newSnapshot = { ...snapshot, id: snapshot.id || generateId(), updatedAt: ts };
      return {
        ...state,
        investments: (state.investments || []).map(acc =>
          acc.id === accountId
            ? { ...acc, snapshots: [...(acc.snapshots || []), newSnapshot], updatedAt: ts }
            : acc
        )
      };
    }
    default:
      return state;
  }
}
