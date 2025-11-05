import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import styled, { keyframes, css } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Container = styled.div`
  padding: 16px 20px 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  background: #f5f7fb;
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(16, 24, 40, 0.1);
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  text-align: center;
`;

const QRWrapper = styled.div<{ expanded: boolean }>`
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 0 12px #d0d7e6;
  width: 100%;
  max-width: ${(p) => (p.expanded ? '480px' : '360px')};
  display: flex;
  justify-content: center;
  cursor: pointer;
  transition: max-width 0.3s ease;
`;

const Loading = styled.div`
  font-size: 18px;
  color: #64748b;
  margin-top: 24px;
  font-weight: 500;
`;

const ErrorMessage = styled.p`
  color: #be123c;
  font-weight: 600;
  font-size: 15px;
  margin-top: 12px;
`;

const Caption = styled.p`
  font-size: 14px;
  color: #475569;
  max-width: 320px;
  margin-top: 0;
`;

const spin = keyframes`
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
`;

const Spinner = styled.div`
  border: 4px solid #e2e8f0;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: ${spin} 1s linear infinite;
  margin: 24px 0;
`;

const ShowQR: React.FC = () => {
  const { user } = useAuth();
  const [userid, setUserid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        setLoading(false);
        setUserid(null);
        setError('User not authenticated');
        return;
      }
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.userid) {
            setUserid(data.userid);
            setError(null);
          } else {
            setUserid(null);
            setError('No userid found in profile.');
          }
        } else {
          setUserid(null);
          setError('User profile not found.');
        }
      } catch (err) {
        console.error('Error fetching user for QR:', err);
        setUserid(null);
        setError('Failed to load QR information.');
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
        <>
          <Spinner aria-label="Loading spinner" />
          <Loading>Loading your QR code...</Loading>
        </>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : userid ? (
        <Card>
          <Caption>
            Your personal QR code for parking verification.  
          </Caption>
          <QRWrapper
            expanded={expanded}
            aria-label="User QR Code"
            onClick={() => setExpanded((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpanded((prev) => !prev);
              }
            }}
          >
            <QRCode
              value={userid}
              size={expanded ? 400 : 320} // larger size if expanded
              bgColor="#ffffff"
              fgColor="#111827"
              title="User QR Code"
              aria-describedby="qr-instruction"
              role="img"
            />
          </QRWrapper>
          <Caption id="qr-instruction" style={{ marginTop: 8, color: '#334155' }}>
            Your User ID: <strong>{userid}</strong>
          </Caption>
        </Card>
      ) : (
        <ErrorMessage>No User ID found. Please update your profile.</ErrorMessage>
      )}
    </Container>
  );
};

export default ShowQR;
