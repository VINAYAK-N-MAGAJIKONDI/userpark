import { useEffect, useMemo, useState } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './Admin.css';

type FirestoreTimestamp = { seconds?: number; nanoseconds?: number; toDate?: () => Date } | number | Date | null | undefined;

interface UserRecord {
  userid?: string;
  name?: string;
  email?: string;
  photoURL?: string;
  wallet?: {
    balance?: number;
    createdAt?: FirestoreTimestamp;
    total_collected?: number;
  };
  createdAt?: FirestoreTimestamp;
}

interface ParkingSlotRecord {
  id?: string;
  name?: string;
  lat?: number;
  long?: number;
  available?: number;
  slotid1?: boolean;
  slotid2?: boolean;
    slotid3?: boolean;
  slotid4?: boolean;
    slotid5?: boolean;

}

interface ParkingSessionRecord {
  id?: string;
  user_id?: string;
  entry_time?: FirestoreTimestamp;
  exit_time?: FirestoreTimestamp;
  status?: 'active' | 'completed' | string;
  fee_charged?: number;
}

function formatTimestamp(ts?: FirestoreTimestamp) {
  if (!ts) return '-';
  if (typeof ts === 'number') return new Date(ts).toLocaleString();
  if ((ts as any).toDate) {
    try {
      return (ts as any).toDate().toLocaleString();
    } catch (e) {
      return String(ts);
    }
  }
  if (ts instanceof Date) return ts.toLocaleString();
  return String(ts);
}

const Admin = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlotRecord[]>([]);
  const [parkingSessions, setParkingSessions] = useState<ParkingSessionRecord[]>([]);
  const [adminData, setAdminData] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Users (including admin) - we'll separate admin
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers: { id: string; data: UserRecord }[] = usersSnapshot.docs.map(d => ({ id: d.id, data: d.data() as UserRecord }));

        const admin = allUsers.find(u => u.id === 'admin123');
        setAdminData(admin ? admin.data : null);

        const normalUsers = allUsers.filter(u => u.id !== 'admin123').map(u => ({ ...(u.data || {}), userid: u.data?.userid || u.id }));
        setUsers(normalUsers);

        // Parking slots
        const slotsSnapshot = await getDocs(collection(db, 'parkslot'));
        const slots = slotsSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as ParkingSlotRecord) }));
        setParkingSlots(slots);

        // Parking sessions
        const sessionsQuery = query(collection(db, 'parking_sessions'), orderBy('entry_time', 'desc'));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessions = sessionsSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as ParkingSessionRecord) }));
        setParkingSessions(sessions);

        setLoading(false);
      } catch (err) {
        console.error('Admin fetch error:', err);
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => (u.name || '').toLowerCase().includes(q) || (u.userid || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, queryText]);

  const totals = useMemo(() => {
    const totalUsers = users.length;
    const totalSlots = parkingSlots.length;
    const activeSessions = parkingSessions.filter(s => s.status === 'active').length;
    const totalRevenue = parkingSessions.reduce((sum, s) => sum + (s.fee_charged || 0), 0);
    const adminBalance = adminData?.wallet?.balance || 0;
    const adminCollected = adminData?.wallet?.total_collected || 0;
    return { totalUsers, totalSlots, activeSessions, totalRevenue, adminBalance, adminCollected };
  }, [users, parkingSlots, parkingSessions, adminData]);

  if (loading) return <div className="admin-root"><div className="loader">Loading admin dashboard...</div></div>;

  return (
    <div className="admin-root">
      <header className="admin-header">
        <div>
          <h1 className="title">Smart Spot — Admin</h1>
          <p className="subtitle">Overview of users, parking slots and sessions</p>
        </div>
        <div className="header-actions">
          <div className="search">
            <input value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Search users by name, id or email..." />
          </div>
          <button className="btn-refresh" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      </header>

      <main className="admin-grid">
        <section className="cards">
          <div className="card">
            <div className="card-title">Total Users</div>
            <div className="card-value">{totals.totalUsers}</div>
          </div>
          <div className="card">
            <div className="card-title">Parking Spots</div>
            <div className="card-value">{totals.totalSlots}</div>
          </div>
          <div className="card">
            <div className="card-title">Active Sessions</div>
            <div className="card-value">{totals.activeSessions}</div>
          </div>
          <div className="card gradient">
            <div className="card-title">Total Revenue</div>
            <div className="card-value">₹{totals.adminCollected.toFixed(2)}</div>
          </div>
        </section>

        <section className="admin-panel">
          {/* <div className="panel-header">
            <h2>Admin Stats</h2>
            <div className="admin-balance">Balance: ₹{totals.adminBalance} • Collected: ₹{totals.adminCollected}</div>
          </div> */}

          <div className="panel-body">
            <div className="left">
              <div className="box">
                <h3>Users</h3>
                <div className="table-wrap">
                  <table className="striped">
                    <thead>
                      <tr>
                        <th>UID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <tr key={i}>
                          <td className="mono">{u.userid}</td>
                          <td>{u.name || '-'}</td>
                          <td className="muted">{u.email || '-'}</td>
                          <td>₹{u.wallet?.balance ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="right">
              <div className="box">
                <h3>Parking Slots</h3>
                <div className="slot-grid">
                  {parkingSlots.map((s, idx) => (
                    <div key={s.id || idx} className="slot-card">
                      <div className="slot-head">
                        <strong>{s.name || s.id}</strong>
                        <span className="slot-available">{s.available ?? '-'} free</span>
                      </div>
                      <div className="slot-body">
                        <div>Slot1: <span className={`badge ${s.slotid1 ? 'ok' : 'bad'}`}>{s.slotid1 ? 'Free' : 'Occupied'}</span></div>
                        <div>Slot2: <span className={`badge ${s.slotid2 ? 'ok' : 'bad'}`}>{s.slotid2 ? 'Free' : 'Occupied'}</span></div>
                        <div>Slot3: <span className={`badge ${s.slotid3 ? 'ok' : 'bad'}`}>{s.slotid3 ? 'Free' : 'Occupied'}</span></div>

                        {/* <div className="muted small">{s.lat ?? '—'}, {s.long ?? '—'}</div> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="box mt-4">
                <h3>Recent Sessions</h3>
                <div className="table-wrap small">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Entry</th>
                        <th>Exit</th>
                        <th>Status</th>
                        <th>Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parkingSessions.slice(0, 8).map(s => (
                        <tr key={s.id}>
                          <td className="mono">{s.user_id}</td>
                          <td className="muted small">{formatTimestamp(s.entry_time)}</td>
                          <td className="muted small">{formatTimestamp(s.exit_time)}</td>
                          <td><span className={`status ${s.status === 'active' ? 'active' : 'completed'}`}>{s.status}</span></td>
                          <td>₹{(s.fee_charged ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="admin-footer">Updated: {new Date().toLocaleString()}</footer>
    </div>
  );
};

export default Admin;