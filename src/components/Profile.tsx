import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Navigate } from 'react-router-dom';

const ProfileContainer = styled.div`
  padding: 20px;
`;

const Card = styled.div`
  max-width: 480px;
  padding: 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <ProfileContainer>
      <h1>Your Profile</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          <p><strong>Name:</strong> {profile?.name || user.displayName}</p>
          <p><strong>Email:</strong> {profile?.email || user.email}</p>
          <p><strong>UserID:</strong> {profile?.userid || '—'}</p>
          <p><strong>Wallet balance:</strong> {profile?.wallet?.balance != null ? profile.wallet.balance : '0'}</p>

          <div style={{ marginTop: 12 }}>
            {!showAdd ? (
              <button onClick={() => { setShowAdd(true); setMessage(null); }} style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Add Money
              </button>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setMessage(null);
                const v = parseFloat(amount);
                if (isNaN(v) || v <= 0) {
                  setMessage('Enter a valid positive amount');
                  return;
                }
                setSubmitting(true);
                try {
                  const userRef = doc(db, 'users', user.uid);
                  await updateDoc(userRef, { 'wallet.balance': increment(v) });
                  const snap = await getDoc(userRef);
                  if (snap.exists()) setProfile(snap.data());
                  setMessage('Amount added successfully');
                  setAmount('');
                  setShowAdd(false);
                } catch (err) {
                  console.error('Error adding money:', err);
                  setMessage('Failed to add amount');
                } finally {
                  setSubmitting(false);
                }
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" step="0.01" min="0" style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
                  <button type="submit" disabled={submitting} style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{submitting ? 'Adding...' : 'Submit'}</button>
                  <button type="button" onClick={() => { setShowAdd(false); setAmount(''); setMessage(null); }} style={{ padding: '8px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                </div>
                {message && <p style={{ marginTop: 8 }}>{message}</p>}
              </form>
            )}
          </div>
        </Card>
      )}
    </ProfileContainer>
  );
};

export default Profile;
