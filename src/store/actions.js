export const BUDGET_ACTIONS = {
  HYDRATE_FROM_STORAGE: "meta/hydrateFromStorage",
  IMPORT_BUDGET: "meta/importBudget",
  MERGE_FROM_CLOUD: "meta/mergeFromCloud",
  RESET_FOYER: "meta/resetFoyer",
  MIGRATE_DATA_VERSION: "meta/migrateDataVersion",
  SET_ACTIVE_MONTH: "meta/setActiveMonth",
  SET_THEME_MODE: "meta/setThemeMode",
  UPSERT_CATEGORY: "meta/upsertCategory",
  DELETE_CATEGORY: "meta/deleteCategory",
  ARCHIVE_CATEGORY: "meta/archiveCategory",
  ADD_PERSON: "meta/addPerson",
  UPDATE_PERSON_NAME: "meta/updatePersonName",
  SET_PERSON_TYPE: "meta/setPersonType",
  REMOVE_PERSON: "meta/removePerson",
  SAVE_MONTH_SIMULATION: "meta/saveMonthSimulation",
  ADD_EXPENSE: "expenses/addExpense",
  UPDATE_EXPENSE: "expenses/updateExpense",
  DELETE_EXPENSE: "expenses/deleteExpense",
  ADD_FIXED_CHARGE: "fixedCharges/addFixedCharge",
  UPDATE_FIXED_CHARGE: "fixedCharges/updateFixedCharge",
  DELETE_FIXED_CHARGE: "fixedCharges/deleteFixedCharge",
  ADD_LOAN: "loans/addLoan",
  UPDATE_LOAN: "loans/updateLoan",
  DELETE_LOAN: "loans/deleteLoan",
  APPLY_EXTRA_PAYMENT: "loans/applyExtraPayment",
  ADD_SAVINGS_ACCOUNT: "savings/addAccount",
  UPDATE_SAVINGS_ACCOUNT_METADATA: "savings/updateAccountMetadata",
  DELETE_SAVINGS_ACCOUNT: "savings/deleteAccount",
  ADD_SAVINGS_MOVEMENT: "savings/addMovement",
  UPDATE_SAVINGS_MOVEMENT: "savings/updateMovement",
  DELETE_SAVINGS_MOVEMENT: "savings/deleteMovement",
  ADD_SAVINGS_OBJECTIVE: "savings/addObjective",
  ADD_INVESTMENT_ACCOUNT: "investments/addAccount",
  UPDATE_INVESTMENT_ACCOUNT: "investments/updateAccount",
  ARCHIVE_INVESTMENT_ACCOUNT: "investments/archiveAccount",
  DELETE_INVESTMENT_ACCOUNT: "investments/deleteAccount",
  ADD_INVESTMENT_SNAPSHOT: "investments/addSnapshot"
};

export const hydrateFromStorage = state => ({
  type: BUDGET_ACTIONS.HYDRATE_FROM_STORAGE,
  payload: { state }
});

export const importBudget = ({ mode, data, source }) => ({
  type: BUDGET_ACTIONS.IMPORT_BUDGET,
  payload: { mode, data, source }
});

export const mergeFromCloud = ({ cloudState, strategy = "updatedAt" }) => ({
  type: BUDGET_ACTIONS.MERGE_FROM_CLOUD,
  payload: { cloudState, strategy }
});

export const resetFoyer = foyerId => ({
  type: BUDGET_ACTIONS.RESET_FOYER,
  payload: { foyerId }
});

export const migrateDataVersion = dataVersion => ({
  type: BUDGET_ACTIONS.MIGRATE_DATA_VERSION,
  payload: { dataVersion }
});

export const setActiveMonth = month => ({
  type: BUDGET_ACTIONS.SET_ACTIVE_MONTH,
  payload: { month }
});

export const setThemeMode = mode => ({
  type: BUDGET_ACTIONS.SET_THEME_MODE,
  payload: { mode }
});

export const upsertCategory = category => ({
  type: BUDGET_ACTIONS.UPSERT_CATEGORY,
  payload: { category }
});

export const deleteCategory = categoryId => ({
  type: BUDGET_ACTIONS.DELETE_CATEGORY,
  payload: { categoryId }
});

export const archiveCategory = categoryId => ({
  type: BUDGET_ACTIONS.ARCHIVE_CATEGORY,
  payload: { categoryId }
});

export const addPerson = person => ({
  type: BUDGET_ACTIONS.ADD_PERSON,
  payload: { person }
});

export const updatePersonName = (personId, name) => ({
  type: BUDGET_ACTIONS.UPDATE_PERSON_NAME,
  payload: { personId, name }
});

export const setPersonType = (personId, personType) => ({
  type: BUDGET_ACTIONS.SET_PERSON_TYPE,
  payload: { personId, personType }
});

export const removePerson = personId => ({
  type: BUDGET_ACTIONS.REMOVE_PERSON,
  payload: { personId }
});

export const saveMonthSimulation = (monthKey, monthData) => ({
  type: BUDGET_ACTIONS.SAVE_MONTH_SIMULATION,
  payload: { monthKey, monthData }
});

export const addExpense = (monthKey, expense) => ({
  type: BUDGET_ACTIONS.ADD_EXPENSE,
  payload: { monthKey, expense }
});

export const updateExpense = (monthKey, expenseId, patch) => ({
  type: BUDGET_ACTIONS.UPDATE_EXPENSE,
  payload: { monthKey, expenseId, patch }
});

export const deleteExpense = (monthKey, expenseId) => ({
  type: BUDGET_ACTIONS.DELETE_EXPENSE,
  payload: { monthKey, expenseId }
});

export const addFixedCharge = (monthKey, charge) => ({
  type: BUDGET_ACTIONS.ADD_FIXED_CHARGE,
  payload: { monthKey, charge }
});

export const updateFixedCharge = (monthKey, chargeId, patch) => ({
  type: BUDGET_ACTIONS.UPDATE_FIXED_CHARGE,
  payload: { monthKey, chargeId, patch }
});

export const deleteFixedCharge = (monthKey, chargeId) => ({
  type: BUDGET_ACTIONS.DELETE_FIXED_CHARGE,
  payload: { monthKey, chargeId }
});

export const addLoan = loan => ({
  type: BUDGET_ACTIONS.ADD_LOAN,
  payload: { loan }
});

export const updateLoan = (loanId, patch) => ({
  type: BUDGET_ACTIONS.UPDATE_LOAN,
  payload: { loanId, patch }
});

export const deleteLoan = loanId => ({
  type: BUDGET_ACTIONS.DELETE_LOAN,
  payload: { loanId }
});

export const applyExtraPayment = (loanId, amount) => ({
  type: BUDGET_ACTIONS.APPLY_EXTRA_PAYMENT,
  payload: { loanId, amount }
});

export const addSavingsAccount = account => ({
  type: BUDGET_ACTIONS.ADD_SAVINGS_ACCOUNT,
  payload: { account }
});

export const updateSavingsAccountMetadata = (accountId, patch) => ({
  type: BUDGET_ACTIONS.UPDATE_SAVINGS_ACCOUNT_METADATA,
  payload: { accountId, patch }
});

export const deleteSavingsAccount = accountId => ({
  type: BUDGET_ACTIONS.DELETE_SAVINGS_ACCOUNT,
  payload: { accountId }
});

export const addSavingsMovement = (accountId, movement) => ({
  type: BUDGET_ACTIONS.ADD_SAVINGS_MOVEMENT,
  payload: { accountId, movement }
});

export const updateSavingsMovement = (accountId, movementId, patch) => ({
  type: BUDGET_ACTIONS.UPDATE_SAVINGS_MOVEMENT,
  payload: { accountId, movementId, patch }
});

export const deleteSavingsMovement = (accountId, movementId) => ({
  type: BUDGET_ACTIONS.DELETE_SAVINGS_MOVEMENT,
  payload: { accountId, movementId }
});

export const addSavingsObjective = (accountId, objective) => ({
  type: BUDGET_ACTIONS.ADD_SAVINGS_OBJECTIVE,
  payload: { accountId, objective }
});

export const addInvestmentAccount = account => ({
  type: BUDGET_ACTIONS.ADD_INVESTMENT_ACCOUNT,
  payload: { account }
});

export const updateInvestmentAccount = (accountId, patch) => ({
  type: BUDGET_ACTIONS.UPDATE_INVESTMENT_ACCOUNT,
  payload: { accountId, patch }
});

export const archiveInvestmentAccount = accountId => ({
  type: BUDGET_ACTIONS.ARCHIVE_INVESTMENT_ACCOUNT,
  payload: { accountId }
});

export const deleteInvestmentAccount = accountId => ({
  type: BUDGET_ACTIONS.DELETE_INVESTMENT_ACCOUNT,
  payload: { accountId }
});

export const addInvestmentSnapshot = (accountId, snapshot) => ({
  type: BUDGET_ACTIONS.ADD_INVESTMENT_SNAPSHOT,
  payload: { accountId, snapshot }
});
