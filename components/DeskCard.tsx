interface DeskCardProps {
  deskNumber: string;
  floorName: string;
  zoneName?: string | null;
  features: string[];
  isAvailable: boolean;
  score?: number;
  distance?: number | null;
  similarity?: number | null;
  onBook?: () => void;
}

export default function DeskCard({
  deskNumber,
  floorName,
  zoneName,
  features,
  isAvailable,
  score,
  distance,
  similarity,
  onBook,
}: DeskCardProps) {
  return (
    <div className="card card-hover">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{deskNumber}</h3>
          <p className="text-sm text-gray-600">
            {floorName} {zoneName ? `• ${zoneName}` : ''}
          </p>
        </div>
        <span
          className={`badge ${
            isAvailable ? 'badge-success' : 'badge-danger'
          }`}
        >
          {isAvailable ? 'Available' : 'Booked'}
        </span>
      </div>

      {features.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {features.map((feature) => (
            <span
              key={feature}
              className="badge badge-primary text-xs"
            >
              {feature}
            </span>
          ))}
        </div>
      )}

      {(score !== undefined || distance !== undefined || similarity !== undefined) && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
          {score !== undefined && (
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">Score</p>
              <p className="font-semibold text-gray-900">{(score * 100).toFixed(0)}%</p>
            </div>
          )}
          {distance !== null && distance !== undefined && (
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">Distance</p>
              <p className="font-semibold text-gray-900">{distance.toFixed(0)}m</p>
            </div>
          )}
          {similarity !== undefined && similarity !== null && (
            <div className="bg-gray-50 rounded p-2">
              <p className="text-gray-500">Match</p>
              <p className="font-semibold text-gray-900">{(similarity * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>
      )}

      {isAvailable && onBook && (
        <button onClick={onBook} className="btn btn-primary w-full">
          Book Desk
        </button>
      )}
    </div>
  );
}
