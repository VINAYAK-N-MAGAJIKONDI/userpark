import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Container = styled.div`
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 80px; /* space for bottom nav */
  flex-direction: column;
`;

const Card = styled.div`
  width: 100%;
  max-width: 520px;
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 6px 20px rgba(16,24,40,0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
`;

const QRWrapper = styled.div`
  background: white;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
`;

const ShowQR: React.FC = () => {
  const { user } = useAuth();
  const [userid, setUserid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserid(data?.userid || null);
        } else {
          setUserid(null);
        }
      } catch (err) {
        console.error('Error fetching user for QR:', err);
        setUserid(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Container>
      <h1>Your QR Code</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          {/* <p><strong>Your 3-digit code</strong></p>
          <p style={{fontSize: 22, letterSpacing: 4}}>{userid || '—'}</p> */}

          {userid ? (
            <QRWrapper>
              <QRCode value={userid} size={192} />
            </QRWrapper>
          ) : (
            <p>No userid found. Make sure your profile was created after sign-in.</p>
          )}

        </Card>
      )}
    </Container>
  );
};

export default ShowQR;
