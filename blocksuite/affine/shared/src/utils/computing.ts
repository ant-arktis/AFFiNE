import groupBy from 'lodash-es/groupBy';
import maxBy from 'lodash-es/maxBy';

export function getMostCommonValue<T, F extends keyof T>(
  records: T[],
  field: F
) {
  const grouped = groupBy(records, record => record[field]);
  const values = Object.values(grouped);
  const record = maxBy(values, records => records.length)?.[0];
  return record?.[field];
}

export function getMostCommonResolvedValue<
  T,
  F extends Exclude<keyof T, symbol>,
  U,
>(records: T[], field: F, resolve: (value: T[F]) => U) {
  return getMostCommonValue(
    records.map(record => ({ [field]: resolve(record[field]) })),
    field
  );
}
