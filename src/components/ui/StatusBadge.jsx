const STATUS_STYLES = {
  pending: 'badge-pending',
  processing: 'badge-processing',
  informed: 'badge-informed',
  dispatched: 'badge-dispatched',
  successful: 'badge-successful',
  rejected: 'badge-rejected',
};

const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  informed: 'Informed',
  dispatched: 'Dispatched',
  successful: 'Successful',
  rejected: 'Rejected',
};

export default function StatusBadge({ status }) {
  return (
    <span className={STATUS_STYLES[status] || 'badge'}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export { STATUS_LABELS };
