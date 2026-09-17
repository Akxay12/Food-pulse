import React, { useState } from 'react';
import { db, auth, storage, isFirebaseConfigured } from '../../services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

type TestStatus = 'idle' | 'running' | 'pass' | 'fail';

interface TestResult {
  name: string;
  status: TestStatus;
  message: string;
  duration?: number;
}

const initialTests: TestResult[] = [
  { name: 'Firebase Config', status: 'idle', message: 'Not started' },
  { name: 'Firestore Write', status: 'idle', message: 'Not started' },
  { name: 'Firestore Read', status: 'idle', message: 'Not started' },
  { name: 'Firestore Delete', status: 'idle', message: 'Not started' },
  { name: 'Anonymous Auth', status: 'idle', message: 'Not started' },
  { name: 'Storage Upload', status: 'idle', message: 'Not started' },
];

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

const StatusIcon = ({ status }: { status: TestStatus }) => {
  const map: Record<TestStatus, string> = { idle: '⚪', running: '⟳', pass: '✅', fail: '❌' };
  return (
    <span style={{ fontSize: 20, display: 'inline-block', animation: status === 'running' ? 'spin 1s linear infinite' : 'none' }}>
      {map[status]}
    </span>
  );
};

export default function FirebaseTestScreen() {
  const [tests, setTests] = useState<TestResult[]>(initialTests);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const update = (name: string, status: TestStatus, message: string, duration?: number) =>
    setTests(prev => prev.map(t => t.name === name ? { ...t, status, message, duration } : t));

  const addLog = (msg: string) =>
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const runTests = async () => {
    setRunning(true);
    setLog([]);
    setTests(initialTests.map(t => ({ ...t, status: 'idle', message: 'Pending...' })));

    update('Firebase Config', 'running', 'Checking env variables...');
    await delay(300);
    if (isFirebaseConfigured) {
      update('Firebase Config', 'pass', 'All env variables present');
      addLog('Firebase config loaded from .env');
    } else {
      update('Firebase Config', 'fail', 'Missing env variables — check .env');
      addLog('Firebase config missing');
      setRunning(false);
      return;
    }

    update('Firestore Write', 'running', 'Writing test document...');
    let docId: string | null = null;
    const t2 = Date.now();
    try {
      const docRef = await addDoc(collection(db!, '_connection_test'), { ts: Date.now(), test: true });
      docId = docRef.id;
      const dur = Date.now() - t2;
      update('Firestore Write', 'pass', `Doc: ${docId.slice(0, 16)}... (${dur}ms)`, dur);
      addLog(`Firestore write OK — id: ${docId}`);
    } catch (e: any) {
      update('Firestore Write', 'fail', e.message);
      addLog(`Firestore write error: ${e.message}`);
    }

    update('Firestore Read', 'running', 'Reading documents...');
    const t3 = Date.now();
    try {
      const snap = await getDocs(collection(db!, '_connection_test'));
      const dur = Date.now() - t3;
      update('Firestore Read', 'pass', `${snap.size} doc(s) found (${dur}ms)`, dur);
      addLog(`Firestore read OK — ${snap.size} doc(s)`);
    } catch (e: any) {
      update('Firestore Read', 'fail', e.message);
      addLog(`Firestore read error: ${e.message}`);
    }

    update('Firestore Delete', 'running', 'Cleaning up...');
    if (docId) {
      const t4 = Date.now();
      try {
        await deleteDoc(doc(db!, '_connection_test', docId));
        const dur = Date.now() - t4;
        update('Firestore Delete', 'pass', `Cleaned up (${dur}ms)`, dur);
        addLog('Firestore delete OK');
      } catch (e: any) {
        update('Firestore Delete', 'fail', e.message);
        addLog(`Firestore delete error: ${e.message}`);
      }
    } else {
      update('Firestore Delete', 'fail', 'Skipped — write failed');
    }

    update('Anonymous Auth', 'running', 'Signing in anonymously...');
    const t5 = Date.now();
    try {
      const cred = await signInAnonymously(auth!);
      await signOut(auth!);
      const dur = Date.now() - t5;
      update('Anonymous Auth', 'pass', `UID: ${cred.user.uid.slice(0, 14)}... (${dur}ms)`, dur);
      addLog(`Auth OK — UID: ${cred.user.uid}`);
    } catch (e: any) {
      update('Anonymous Auth', 'fail', e.message);
      addLog(`Auth error: ${e.message}`);
    }

    update('Storage Upload', 'running', 'Uploading test file...');
    const t6 = Date.now();
    try {
      const storageRef = ref(storage!, '_connection_test/ping.txt');
      await uploadString(storageRef, 'Food-Pulse connection test');
      await getDownloadURL(storageRef);
      await deleteObject(storageRef);
      const dur = Date.now() - t6;
      update('Storage Upload', 'pass', `Upload + delete OK (${dur}ms)`, dur);
      addLog('Storage OK');
    } catch (e: any) {
      update('Storage Upload', 'fail', e.message);
      addLog(`Storage error: ${e.message}`);
    }

    setRunning(false);
    addLog('All tests complete');
  };

  const passed = tests.filter(t => t.status === 'pass').length;
  const failed = tests.filter(t => t.status === 'fail').length;
  const total = tests.length;

  const borderCol = (s: TestStatus) => ({ pass: 'rgba(16,185,129,0.35)', fail: 'rgba(248,113,113,0.35)', running: 'rgba(251,191,36,0.35)', idle: 'rgba(255,255,255,0.07)' }[s]);
  const bgCol = (s: TestStatus) => ({ pass: 'rgba(16,185,129,0.07)', fail: 'rgba(248,113,113,0.07)', running: 'rgba(251,191,36,0.07)', idle: 'rgba(255,255,255,0.03)' }[s]);
  const textCol = (s: TestStatus) => ({ pass: '#6ee7b7', fail: '#f87171', running: '#fbbf24', idle: '#94a3b8' }[s]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)', color: '#e2e8f0', fontFamily: "'Inter','Segoe UI',sans-serif", padding: '40px 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.55;} }
      `}</style>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36, animation: 'fadeIn 0.5s ease' }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🔥</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Firebase Connection Test</h1>
          <p style={{ color: '#94a3b8', marginTop: 8, fontSize: 13 }}>
            Project: <code style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 10px', borderRadius: 5 }}>food-pulse-9c3a6</code>
          </p>
        </div>

        {(passed + failed) > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(passed / total) * 100}%`, background: failed > 0 ? 'linear-gradient(90deg,#10b981,#f59e0b)' : 'linear-gradient(90deg,#10b981,#34d399)', borderRadius: 8, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {passed}/{total} passed {failed > 0 && <span style={{ color: '#f87171' }}>· {failed} failed</span>}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {tests.map((t, i) => (
            <div key={t.name} style={{ background: bgCol(t.status), border: `1px solid ${borderCol(t.status)}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, animation: `fadeIn 0.3s ease ${i * 0.05}s both`, transition: 'background 0.3s,border-color 0.3s' }}>
              <StatusIcon status={t.status} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 12, marginTop: 2, color: textCol(t.status), animation: t.status === 'running' ? 'pulse 1.2s ease infinite' : 'none' }}>{t.message}</div>
              </div>
              {t.duration !== undefined && (
                <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>{t.duration}ms</span>
              )}
            </div>
          ))}
        </div>

        <button id="firebase-run-tests-btn" onClick={runTests} disabled={running} style={{ width: '100%', padding: '15px', background: running ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#f59e0b,#ef4444)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s', animation: running ? 'pulse 1.5s ease infinite' : 'none' }}>
          {running ? '⟳ Running Tests...' : '▶  Run All Connection Tests'}
        </button>

        {log.length > 0 && (
          <div style={{ marginTop: 22, background: 'rgba(0,0,0,0.45)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Console</div>
            {log.map((line, i) => (
              <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: line.includes('error') ? '#f87171' : line.includes('All tests') ? '#f59e0b' : '#6ee7b7', padding: '3px 0', borderBottom: i < log.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>{line}</div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#475569' }}>
          Writes to <code>_connection_test</code> collection and cleans up after itself.
        </p>
      </div>
    </div>
  );
}
