"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, History, Trash2, Clock, X, Copy, Check, 
  RefreshCw, Loader, Globe, Database, Settings, ChevronRight, User as UserIcon, LogOut 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function RestClient() {
  const router = useRouter();
  

  const [user, setUser] = useState(null);
  
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('');
  
  // Response State
  const [response, setResponse] = useState('');
  const [statusCode, setStatusCode] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // History Sidebar State
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token) {
      router.push('/auth');
    } else if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);


  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/requests?page=1&limit=30`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setHistory(data.requests);
        setTotalCount(data.total);
      }
    } catch (error) {
      console.error('History fetch failed:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (localStorage.getItem('token')) loadHistory();
  }, [loadHistory]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  const sendRequest = async () => {
    setLoading(true);
    setResponse('');
    const startTime = performance.now();

    try {
    
      const fetchOptions = {
        method,
        headers: JSON.parse(headers),
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? body : undefined,
      };

      const res = await fetch(url, fetchOptions);
      const data = await res.json();
      const endTime = performance.now();
      const requestDuration = Math.round(endTime - startTime);

      const formattedRes = JSON.stringify(data, null, 2);
      setResponse(formattedRes);
      setStatusCode(res.status);
      setDuration(requestDuration);

     
      await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          method, url, headers, body,
          response: formattedRes,
          statusCode: res.status,
          duration: requestDuration
        })
      });
      loadHistory();
    } catch (error) {
      setResponse(JSON.stringify({ error: error.message }, null, 2));
      setStatusCode(500);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/requests/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      loadHistory();
    } catch (error) { console.error(error); }
  };

  const getStatusColor = (code) => {
    if (!code) return 'text-slate-400';
    if (code >= 200 && code < 300) return 'text-emerald-400';
    if (code >= 400) return 'text-rose-400';
    return 'text-amber-400';
  };

  if (!user) return null; 

  return (
    <div className="flex h-screen overflow-hidden">
   
      <aside className={`${showHistory ? 'w-80' : 'w-0'} transition-all duration-500 glass-card bg-opacity-10 border-none flex flex-col z-20`}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2 text-white text-xs tracking-[0.2em]">
            <History size={16} className="text-blue-400" /> ACTIVITY
          </h2>
          <button onClick={loadHistory} className="text-slate-500 hover:text-white transition">
            <RefreshCw size={14} className={isLoadingHistory ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {history.map((item) => (
            <div 
              key={item._id} 
              onClick={() => { setMethod(item.method); setUrl(item.url); setResponse(item.response); }}
              className="p-3 mb-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-all border border-transparent hover:border-white/10"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-black/30 ${getStatusColor(item.statusCode)}`}>
                  {item.method}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="text-[11px] truncate text-slate-400 font-mono">{item.url}</div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item._id); }}
                className="mt-2 opacity-0 group-hover:opacity-100 text-rose-500/50 hover:text-rose-500 transition-all ml-auto block"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
  
        <header className="h-16 flex items-center px-8 justify-between bg-black/20 backdrop-blur-xl border-b border-white/5 z-10">
          <div className="flex items-center gap-6">
            <button onClick={() => setShowHistory(!showHistory)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
              <ChevronRight className={showHistory ? 'rotate-180' : ''} size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Globe size={18} className="text-white" />
              </div>
              <h1 className="font-black text-lg tracking-tighter text-white uppercase italic">API<span className="text-blue-500">Flow</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-bold">
                {user.name[0]}
              </div>
              <span className="text-xs font-semibold text-slate-300 hidden sm:block">{user.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
       
          <section className="glass-card p-2 rounded-2xl flex gap-3">
            <select 
              value={method} 
              onChange={(e) => setMethod(e.target.value)}
              className="bg-white/5 text-blue-400 font-black px-5 py-3 rounded-xl outline-none border border-white/5 focus:border-blue-500/50 transition-all cursor-pointer text-xs"
            >
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} className="bg-slate-900">{m}</option>)}
            </select>
            <input 
              type="text" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 glass-input px-6 py-3 rounded-xl text-slate-100 placeholder:text-slate-600 font-mono text-sm"
              placeholder="Enter request URL..."
            />
            <button 
              onClick={sendRequest}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20"
            >
              {loading ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
              SEND
            </button>
          </section>

    
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Headers</label>
              <textarea 
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full h-48 glass-input rounded-2xl p-5 font-mono text-xs text-blue-300 leading-relaxed"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Body</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={method === 'GET'}
                placeholder='{ "key": "value" }'
                className="w-full h-48 glass-input rounded-2xl p-5 font-mono text-xs text-slate-300 leading-relaxed disabled:opacity-20"
              />
            </div>
          </section>

          <section className="glass-card rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
              <div className="flex gap-4 items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Response</span>
                {statusCode && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 ${getStatusColor(statusCode)}`}>
                    {statusCode} {statusCode === 200 ? 'OK' : ''}
                  </span>
                )}
                {duration && <span className="text-[10px] text-slate-600 font-mono">{duration}ms</span>}
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(response); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
                className="text-slate-500 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'COPIED' : 'COPY JSON'}
              </button>
            </div>
            <pre className="p-8 text-xs font-mono text-emerald-400/90 overflow-auto max-h-[450px] bg-black/20 custom-scrollbar leading-relaxed">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader size={24} className="animate-spin text-blue-500" />
                  <span className="text-slate-500 uppercase tracking-[0.2em] text-[9px]">Processing Request...</span>
                </div>
              ) : response || "// Response data will appear here..."}
            </pre>
          </section>
        </div>

      
        <footer className="h-8 glass-card border-none rounded-none bg-blue-600 flex items-center px-6 justify-between text-[9px] font-black text-white z-30">
          <div className="flex gap-6 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Database size={10}/> MongoDB Atlas: Connected</span>
            <span className="flex items-center gap-1.5 opacity-70"><Globe size={10}/> API Proxy: Active</span>
          </div>
          <div className="opacity-70">SYSTEM STATUS: OPTIMAL</div>
        </footer>
      </main>
    </div>
  );
}