import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  padding: 24px;
`;

const LoginButton = styled.button`
  padding: 12px 20px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
  max-width: 360px;
  transition: background-color 0.18s, transform 0.12s;
  &:hover { background-color: #3367d6; transform: translateY(-2px); }
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(16,24,40,0.08);
  text-align: center;
`;

const Login: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <LoginContainer>
      <Card>
        <h1 style={{ marginTop: 8 }}>Smart Spot</h1>
        <p style={{ color: '#666' }}>Find the nearest parking spot and manage your wallet.</p>
        <LoginButton onClick={signInWithGoogle}>Sign in with Google</LoginButton>
      </Card>
    </LoginContainer>
  );
};

export default Login;
