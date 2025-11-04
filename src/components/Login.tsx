import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const LoginButton = styled.button`
  padding: 12px 24px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #3367d6;
  }
`;

const Login = () => {
  const { user, signInWithGoogle } = useAuth();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <LoginContainer>
      <h1>Welcome to UserPark</h1>
      <p>Find the nearest parking spot with ease</p>
      <LoginButton onClick={signInWithGoogle}>
        Sign in with Google
      </LoginButton>
    </LoginContainer>
  );
};

export default Login;