import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const AppShell = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #f6f8fb 0%, #ffffff 100%);
  color: #222;
`;

const TopBar = styled.header`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #ffffff;
  box-shadow: 0 1px 6px rgba(16,24,40,0.06);
  position: sticky;
  top: 0;
  z-index: 30;
`;

const Title = styled.h1`
  font-size: 18px;
  margin: 0;
`;

const Content = styled.main`
  flex: 1 1 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BottomNav = styled.nav`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #fff;
  border-top: 1px solid #eee;
  position: sticky;
  bottom: 0;
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #333;
  text-decoration: none;
  font-size: 12px;
`;

const Icon = styled.span`
  width: 22px;
  height: 22px;
  display: inline-block;
  margin-bottom: 4px;
`;

const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <AppShell>
      <TopBar>
        <Title>Smart Spot</Title>
        <div />
      </TopBar>

      <Content>
        {children}
      </Content>

      <BottomNav>
        <NavItem to="/home">
          <Icon>🚗</Icon>
          Home
        </NavItem>
        <NavItem to="/qr">
          <Icon>🔲</Icon>
          QR
        </NavItem>
        <NavItem to="/profile">
          <Icon>👤</Icon>
          Profile
        </NavItem>
      </BottomNav>
    </AppShell>
  );
};

export default Layout;
