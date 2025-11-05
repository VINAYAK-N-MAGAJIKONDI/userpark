import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Navigate } from 'react-router-dom';

// Styled components

const ProfileContainer = styled.div`
  padding: 12px 12px 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: linear-gradient(135deg, #e9ffe9 0%, #e8f0ff 100%);
  min-height: 100vh;
  position: relative;
`;

const Title = styled.h1`
  margin-bottom: 0;
  color: #2563eb;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
`;

const LogoutButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 11px 20px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 700;
  transition: background 0.14s, transform 0.12s;
  &:hover {
    background: #dc2626;
    transform: translateY(-2.5px);
  }
`;

const TopRightSection = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  max-width: 350px;
  width: 100%;
  z-index: 100;
`;

const HistoryBox = styled.div`
  background: #fff;
  box-shadow: 0 4px 16px #e0e7ff33;
  border-radius: 10px;
  min-width: 310px;
  max-width: 390px;
  padding: 18px 20px;
  max-height: 350px;
  overflow-y: auto;
`;

const HistoryTitle = styled.h2`
  color: #2563eb;
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: left;
`;

const ToggleHistoryButton = styled.button`
  padding: 6px 14px;
  font-size: 13px;
  font-weight: bold;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.25s ease;
  &:hover {
    background-color: #174ea6;
  }
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 28px 22px 32px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 26px rgba(16, 24, 40, 0.12);
  position: relative;
  text-align: center;
`;

const Avatar = styled.div`
  background: linear-gradient(135deg, #e0e7ff 0%, #f1fff1 100%);
  width: 78px;
  height: 78px;
  border-radius: 50%;
  margin: 0 auto 18px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #4481eb;
  box-shadow: 0 4px 16px #e0e7ff66;
`;

const Section = styled.div`
  margin-top: 14px;
  margin-bottom: 10px;
`;

const Stat = styled.p`
  margin: 4px 0;
  font-size: 15px;
`;

const BalanceBox = styled.div`
  margin-top: 14px;
  padding: 10px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f1ffe9 80%, #e0f7fa 100%);
  color: #16a34a;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const ErrorBox = styled.div`
  margin-top: 14px;
  color: #991b1b;
  background: #fee2e2;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 15px;
`;

const Message = styled.p`
  margin-top: 10px;
  color: #2563eb;
  font-size: 14px;
`;

const PrimaryButton = styled.button`
  padding: 9px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  margin-top: 4px;
  transition: background 0.14s, transform 0.12s;
  &:hover {
    background: #174ea6;
    transform: translateY(-2px);
  }
`;

const FormButton = styled.button<{ $variant?: 'green' | 'grey' }>`
  padding: 8px 13px;
  background: ${({ $variant }) => ($variant === 'green' ? '#28a745' : '#6c757d')};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: ${({ $variant }) => ($variant === 'grey' ? '6px' : '0')};
  font-weight: 500;
  font-size: 15px;
  &:hover {
    background: ${({ $variant }) => ($variant === 'green' ? '#218838' : '#495057')};
    transform: translateY(-2px);
  }
`;

const Input = styled.input`
  padding: 9px;
  border-radius: 4px;
  border: 1.5px solid #d4d4d4;
  font-size: 15px;
  width: 120px;
`;

const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setError(null);
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          setProfile(null);
          setError('Profile not found.');
        }
      } catch {
        setError('Could not load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        setHistoryLoading(true);
        const q = query(
          collection(db, 'reservations'),
          where('user_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const querySnap = await getDocs(q);
        const items: any[] = [];
        for (const docSnap of querySnap.docs) {
          const data = docSnap.data();
          let spotName = data.spot_id;
          try {
            const spotSnap = await getDoc(doc(db, 'parkslot', data.spot_id));
            if (spotSnap.exists()) {
              const spotData = spotSnap.data();
              spotName = spotData.name || data.spot_id;
            }
          } catch {}
          items.push({
            ...data,
            spotName,
          });
        }
        setHistory(items);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const toggleHistory = () => setShowHistory((prev) => !prev);

  return (
    <ProfileContainer>
      <TopRightSection>
        <ToggleHistoryButton onClick={toggleHistory}>
          {showHistory ? 'Hide History' : 'Show History'}
        </ToggleHistoryButton>
        {showHistory && (
          <HistoryBox>
            <HistoryTitle>Reservation History</HistoryTitle>
            {historyLoading ? (
              <Message>Loading history...</Message>
            ) : history.length === 0 ? (
              <Message>No reservations found.</Message>
            ) : (
              <div style={{ fontSize: 13, maxHeight: 350, overflowY: 'auto' }}>
                {history.map((r, idx) => (
                  <div
                    key={r.booking_code + idx}
                    style={{ padding: '4px 0', borderBottom: '1px solid #ccc' }}
                  >
                    <div>
                      <strong>Date:</strong>{' '}
                      {r.created_at?.toDate
                        ? r.created_at.toDate().toLocaleString()
                        : '-'}
                    </div>
                    <div>
                      <strong>Spot:</strong> {r.spotName}
                    </div>
                    <div>
                      <strong>Slot:</strong> {r.slot_id}
                    </div>
                    <div>
                      <strong>Code:</strong>{' '}
                      <code>{r.booking_code}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </HistoryBox>
        )}
        <LogoutButton onClick={logout}>Logout</LogoutButton>
      </TopRightSection>

      <Title>👤 Your Profile</Title>

      {loading ? (
        <Card>
          <Message>Loading your info...</Message>
        </Card>
      ) : (
        <Card>
          <Avatar>
            {profile && profile.name
              ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
              : user.displayName
              ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
              : 'U'}
          </Avatar>

          <Section>
            <Stat>
              <strong>Name:</strong> {profile?.name || user.displayName}
            </Stat>
            <Stat>
              <strong>Email:</strong> {profile?.email || user.email}
            </Stat>
            <Stat>
              <strong>UserID:</strong> {profile?.userid || '—'}
            </Stat>
          </Section>

          <BalanceBox>
            <span>💰</span>
            Wallet: ₹{profile?.wallet?.balance ?? '0'}
          </BalanceBox>

          <Section>
            {!showAdd ? (
              <PrimaryButton
                onClick={() => {
                  setShowAdd(true);
                  setMessage(null);
                }}
              >
                Add Money
              </PrimaryButton>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setMessage(null);
                  setError(null);
                  const value = parseFloat(amount);
                  if (isNaN(value) || value <= 0) {
                    setError('Enter a valid positive amount');
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, { 'wallet.balance': increment(value) });
                    const snap = await getDoc(userRef);
                    if (snap.exists()) setProfile(snap.data());
                    setMessage('Amount added successfully!');
                    setAmount('');
                    setShowAdd(false);
                  } catch {
                    setError('Failed to add amount — please try later.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                  <FormButton type="submit" disabled={submitting} $variant="green">
                    {submitting ? 'Adding...' : 'Submit'}
                  </FormButton>
                  <FormButton
                    type="button"
                    onClick={() => {
                      setShowAdd(false);
                      setAmount('');
                      setMessage(null);
                      setError(null);
                    }}
                    $variant="grey"
                  >
                    Cancel
                  </FormButton>
                </div>
                {error && <ErrorBox>{error}</ErrorBox>}
                {message && <Message>{message}</Message>}
              </form>
            )}
          </Section>
        </Card>
      )}
    </ProfileContainer>
  );
};

export default Profile;
