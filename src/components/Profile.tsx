import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
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
        </Card>
      )}
    </ProfileContainer>
  );
};

export default Profile;
