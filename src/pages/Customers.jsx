import { useState } from 'react';
import { useCustomers, useCustomerDetail } from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import { HiOutlineSearch, HiOutlineDocumentSearch, HiOutlineEye, HiOutlineX, HiOutlineDownload } from 'react-icons/hi';
import DateFilter from '../components/ui/DateFilter';

function CustomerModal({ customerId, onClose }) {
  const { data: customer, isLoading } = useCustomerDetail(customerId);
  const [viewDoc, setViewDoc] = useState(null);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in">
        <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl flex justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{customer.name}</h3>
            <p className="text-sm font-medium text-slate-500">{customer.phone || 'No phone number'} • {customer.visit_count} visits</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500"></span> Service History
          </h4>
          
          {customer.entries?.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No service history found.</div>
          ) : (
            <div className="space-y-3">
              {customer.entries?.map(entry => (
                <div key={entry.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="font-bold text-slate-800">{entry.service_name}</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">
                      {entry.date} • by {entry.staff_name} {entry.srn_number ? `• SRN: ${entry.srn_number}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {entry.document && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setViewDoc(entry.document)}
                          className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                          title="View Document"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                          View
                        </button>
                        <a 
                          href={entry.document} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          download
                          className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                          title="Download Document"
                        >
                          <HiOutlineDownload className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="font-bold text-brand-600">₹{entry.amount}</div>
                      <StatusBadge status={entry.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="btn-secondary px-6">Close</button>
        </div>
      </div>

      {viewDoc && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl flex justify-end mb-4">
            <button 
              onClick={(e) => { e.stopPropagation(); setViewDoc(null); }} 
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center gap-2 font-medium"
            >
              <HiOutlineX className="w-6 h-6" /> Close Document
            </button>
          </div>
          <div className="w-full max-w-5xl bg-transparent rounded-xl overflow-hidden shadow-2xl h-[85vh] flex items-center justify-center relative">
            {viewDoc?.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null ? (
              <img src={viewDoc} alt="Document" className="max-w-full max-h-full object-contain rounded-xl bg-white" />
            ) : (
              <iframe src={viewDoc} className="w-full h-full border-0 bg-white rounded-xl" title="Document Preview" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  const params = {};
  if (search) params.search = search;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  const { data, isLoading } = useCustomers(params);
  const customers = data?.results || [];

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Customers Directory</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">View and search customer history</p>
      </div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full max-w-md">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text" className="input pl-11 w-full"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DateFilter 
            isRange 
            dateFrom={dateFrom} setDateFrom={setDateFrom} 
            dateTo={dateTo} setDateTo={setDateTo} 
            hidePresets={false}
          />
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Added On</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                          <HiOutlineDocumentSearch className="w-8 h-8 text-slate-300" strokeWidth={1} />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No customers found</p>
                      </div>
                    </td>
                  </tr>
                ) : customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-bold text-slate-800">{c.name}</td>
                    <td className="text-brand-600 font-medium">{c.phone || '-'}</td>
                    <td className="text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="text-center">
                      <button
                        onClick={() => setSelectedCustomerId(c.id)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors inline-flex"
                        title="View Service History"
                      >
                        <HiOutlineEye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedCustomerId && (
        <CustomerModal 
          customerId={selectedCustomerId} 
          onClose={() => setSelectedCustomerId(null)} 
        />
      )}
    </div>
  );
}
