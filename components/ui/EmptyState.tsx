interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 ring-1 ring-gray-900/5">
        <Icon className="w-6 h-6 text-gray-300" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-gray-950 tracking-tight">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
