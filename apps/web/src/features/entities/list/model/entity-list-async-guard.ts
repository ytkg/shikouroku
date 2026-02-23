export type EntityListAsyncGuard = {
  sync: (criteriaKey: string) => void;
  isCurrent: (criteriaKey: string) => boolean;
  runIfCurrent: (criteriaKey: string, onCurrent: () => void) => boolean;
};

export function createEntityListAsyncGuard(initialCriteriaKey: string): EntityListAsyncGuard {
  let activeCriteriaKey = initialCriteriaKey;

  return {
    sync(criteriaKey) {
      activeCriteriaKey = criteriaKey;
    },
    isCurrent(criteriaKey) {
      return activeCriteriaKey === criteriaKey;
    },
    runIfCurrent(criteriaKey, onCurrent) {
      if (activeCriteriaKey !== criteriaKey) {
        return false;
      }

      onCurrent();
      return true;
    }
  };
}
