import toast from 'react-hot-toast';

export const confirmAction = (message, onConfirm) => {
  toast(
    (t) => (
      <div className="flex flex-col gap-5 p-3">
        <p className="font-medium text-white text-base md:text-lg">{message}</p>
        <div className="flex gap-3 justify-end mt-3">
          <button
            className="px-5 py-2.5 text-sm font-semibold text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    ),
    {
      id: 'confirm-modal-toast',
      duration: Infinity,
      position: 'top-center',
      style: {
        marginTop: '35vh',
        minWidth: '380px',
        padding: '16px',
        boxShadow: '0 20px 60px -15px rgba(0,0,0,0.4)',
      },
    }
  );
};
