import { useTranslations } from 'next-intl';

interface FilesTableHeaderColumnsProps {
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}

export function FilesTableHeaderColumns({
  isAllSelected,
  onSelectAll,
}: FilesTableHeaderColumnsProps) {
  const t = useTranslations('Admin');

  return (
    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onSelectAll(e.target.checked);
            }}
            checked={isAllSelected}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </th>
        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
          {t('file')}
        </th>
        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
          {t('size')}
        </th>
        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
          {t('type')}
        </th>
        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
          {t('owner')}
        </th>
        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
          {t('uploadDate')}
        </th>
        <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
          {t('downloads')}
        </th>
        <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">
          {t('actions')}
        </th>
      </tr>
    </thead>
  );
}
