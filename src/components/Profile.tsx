import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Navigate } from 'react-router-dom';

// 🎨 Styled Components
const ProfileContainer = styled.div`
  // min-height: 100vh;
  background: #f7f9fc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 450px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.08);
  padding: 32px 28px;
  text-align: center;
  transition: all 0.3s ease;
`;

const Avatar = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  font-weight: 600;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3);
`;

const Name = styled.h2`
  margin-bottom: 4px;
  color: #1d2939;
`;

const Email = styled.p`
  color: #475467;
  font-size: 15px;
  margin-bottom: 20px;
`;

const Info = styled.div`
  
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  margin-bottom: 20px;

  p {
    margin: 6px 0;
    color: #344054;
    font-size: 15px;

    strong {
      color: #101828;
    }
  }
`;

const Wallet = styled.div`
  background: #e8f3ff;
  color: #084298;
  border-radius: 8px;
  padding: 10px 12px;
  display: inline-block;
  margin-bottom: 16px;
  font-weight: 600;
`;

const Button = styled.button<{ variant?: 'primary' | 'success' | 'secondary' }>`
  background: ${({ variant }) =>
    variant === 'success'
      ? '#28a745'
      : variant === 'secondary'
      ? '#6c757d'
      : '#007bff'};
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AddMoneyForm = styled.form`
  display: flex;
  gap: 10px;
  flex-direction: column;
  margin-top: 12px;

  input {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #d0d5dd;
    font-size: 15px;
  }

  .btn-group {
    display: flex;
    gap: 10px;
  }

  p {
    font-size: 14px;
    margin-top: 6px;
    color: #475467;
  }
`;

// ⚡ Component
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
        if (snap.exists()) setProfile(snap.data());
        else setProfile(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const initials =
    profile?.name?.charAt(0)?.toUpperCase() ||
    user?.displayName?.charAt(0)?.toUpperCase() ||
    '?';

  return (
    <ProfileContainer>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          <Avatar>{initials}</Avatar>
          <Name>{profile?.name || user.displayName || 'User'}</Name>
          <Email>{profile?.email || user.email}</Email>

          <Wallet>
             Wallet Balance: ₹
            {profile?.wallet?.balance != null ? profile.wallet.balance : '0'}
          </Wallet>

          <Info>

          </Info>

          {!showAdd ? (
            <Button onClick={() => setShowAdd(true)}>Add Money</Button>
          ) : (
            <AddMoneyForm
              onSubmit={async (e) => {
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
                  setMessage('Amount added successfully ✅');
                  setAmount('');
                  setShowAdd(false);
                } catch (err) {
                  console.error('Error adding money:', err);
                  setMessage('Failed to add amount ❌');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                type="number"
                step="0.01"
                min="0"
              />
              <div className="btn-group">
                <Button type="submit" variant="success" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Submit'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAdd(false);
                    setAmount('');
                    setMessage(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              {message && <p>{message}</p>}
            </AddMoneyForm>
          )}
        </Card>
      )}
    </ProfileContainer>
  );
};

export default Profile;
