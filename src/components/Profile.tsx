import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Navigate } from 'react-router-dom';

// 🎨 Styled Components (These remain unchanged)
const ProfileContainer = styled.div`
  background: #f7f9fc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  min-height: 80vh;
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
    variant === 'success' ? '#28a745' : variant === 'secondary' ? '#6c757d' : '#007bff'};
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
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

  // --- START: PAYMENT LOGIC ---

  // Check if mock payment mode is enabled via environment variable
  const isMockPaymentMode = process.env.REACT_APP_MOCK_PAYMENT === 'true';

  // ⚠️ IMPORTANT: Paste your REAL Stripe Payment Link URL here.
  const STRIPE_PAYMENT_LINK_URL = 'https://buy.stripe.com/test_aFa14ndlp2Mq3JP9Pv6EU00';

  // This is a reusable function to update the user's wallet in Firestore.
  // Both the real Stripe return and the mock payment will use this.
  const updateWalletBalance = async (amountToAdd: number) => {
    if (!user || amountToAdd <= 0) return;

    setMessage('Processing update...');
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 'wallet.balance': increment(amountToAdd) });

      // Fetch the latest profile to show the new balance instantly.
      const snap = await getDoc(userRef);
      if (snap.exists()) setProfile(snap.data());
      setMessage('Wallet topped up successfully! ✅');

    } catch (err) {
      console.error('Error updating wallet:', err);
      setMessage('An error occurred while updating the wallet. Please contact support.');
    }
  };

  // This `useEffect` handles the REAL redirect back from Stripe.
  useEffect(() => {
    const processStripeReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('session_id') && user) {
        const pendingAmountStr = localStorage.getItem('pendingWalletTopUp');
        localStorage.removeItem('pendingWalletTopUp');

        if (pendingAmountStr) {
          const pendingAmount = parseFloat(pendingAmountStr);
          await updateWalletBalance(pendingAmount);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    processStripeReturn();
  }, [user]);

  // This function handles the form submission for adding money.
  const handleAddMoneySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setMessage('Please enter a valid, positive amount.');
      return;
    }
    
    setSubmitting(true);
    await updateWalletBalance(numericAmount);

    // ==========================================================
    // == MOCK PAYMENT LOGIC: Checks if mock mode is enabled.  ==
    // ==========================================================
    if (isMockPaymentMode) {
      setMessage('Processing mock payment...');
      // Simulate a network delay for a more realistic feel.
      setTimeout(async () => {
        await updateWalletBalance(numericAmount);
        setSubmitting(false);
        // Hide the form on success
        setShowAdd(false);
        setAmount('');
      }, 1500); // 1.5-second delay
      return; // Stop execution here for mock mode.
    }
    // ==========================================================
    
    // --- REAL STRIPE PAYMENT LOGIC ---
    // This part only runs if mock mode is OFF.
    const isInteger = Number.isInteger(numericAmount);
    if (!isInteger) {
        setMessage('For Payment Links, please use whole numbers (e.g., 50).');
        setSubmitting(false);
        return;
    }

    localStorage.setItem('pendingWalletTopUp', numericAmount.toString());

    const userEmail = user?.email || '';
    const redirectUrl = `${STRIPE_PAYMENT_LINK_URL}?prefilled_email=${encodeURIComponent(userEmail)}&quantity=${numericAmount}`;
    
    window.location.href = redirectUrl;
  };

  // --- END: PAYMENT LOGIC ---

  // Standard useEffect to fetch the user's profile on load.
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setProfile(snap.data());
      } catch (err) { console.error('Error fetching profile:', err); } 
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const initials = profile?.name?.charAt(0)?.toUpperCase() || user?.displayName?.charAt(0)?.toUpperCase() || '?';

  return (
    <ProfileContainer>
      {loading ? ( <p>Loading...</p> ) : (
        <Card>
          <Avatar>{initials}</Avatar>
          <Name>{profile?.name || user.displayName || 'User'}</Name>
          <Email>{profile?.email || user.email}</Email>

          {isMockPaymentMode && <p style={{color: 'orange', fontWeight: 'bold'}}>-- MOCK PAYMENT MODE ACTIVE --</p>}

          <Wallet>
             Wallet Balance: ₹
            {profile?.wallet?.balance != null ? profile.wallet.balance.toFixed(2) : '0.00'}
          </Wallet>
          
          {/* Display any success or error messages here */}
          {message && !showAdd && <p style={{margin: '15px 0', color: '#0f5132'}}>{message}</p>}

          {!showAdd ? (
            <Button onClick={() => setShowAdd(true)} variant="primary">Add Money</Button>
          ) : (
            <AddMoneyForm onSubmit={handleAddMoneySubmit}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g., 500)"
                type="number"
                step="1" // Only allow whole numbers for quantity
                min="1"
                required
              />
              <div className="btn-group">
                <Button type="submit" variant="success" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Proceed to Pay'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowAdd(false); setAmount(''); setMessage(null); }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
              {message && <p style={{color: submitting ? '#0d6efd' : '#842029'}}>{message}</p>}
            </AddMoneyForm>
          )}
        </Card>
      )}
    </ProfileContainer>
  );
};

export default Profile;