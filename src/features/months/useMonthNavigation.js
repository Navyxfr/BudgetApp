import { useCallback, useState } from "react";
import { addMonths, canNav } from "../../core/date.js";
import { createEmptyMonth, duplicateMonth, hasStoredMonth } from "../../core/months.js";
import { createMonth, setActiveMonth } from "../../store/actions.js";

export function useMonthNavigation({
  currentMonth,
  setCurrentMonth,
  state,
  dispatch,
  monthDependencies,
  notify
}) {
  const [pendingMonth, setPendingMonth] = useState(null);

  const openMonth = useCallback(
    monthKey => {
      setCurrentMonth(monthKey);
      dispatch(setActiveMonth(monthKey));
    },
    [dispatch, setCurrentMonth]
  );

  const navigate = useCallback(
    direction => {
      const targetMonth = addMonths(currentMonth, direction);
      if (!canNav(targetMonth)) return;
      if (hasStoredMonth(state, targetMonth)) {
        openMonth(targetMonth);
        return;
      }
      setPendingMonth({ sourceMonth: currentMonth, targetMonth });
    },
    [currentMonth, openMonth, state]
  );

  const prepareMonth = useCallback(
    mode => {
      if (!pendingMonth) return;
      const { sourceMonth, targetMonth } = pendingMonth;
      const monthData =
        mode === "copy"
          ? duplicateMonth(sourceMonth, targetMonth, state, monthDependencies)
          : createEmptyMonth(targetMonth, state, monthDependencies);
      dispatch(createMonth(targetMonth, monthData));
      setCurrentMonth(targetMonth);
      setPendingMonth(null);
      notify?.(mode === "copy" ? "Organisation du mois reprise" : "Nouveau mois créé");
    },
    [dispatch, monthDependencies, notify, pendingMonth, setCurrentMonth, state]
  );

  const cancelPreparation = useCallback(() => setPendingMonth(null), []);

  return { pendingMonth, navigate, prepareMonth, cancelPreparation };
}
