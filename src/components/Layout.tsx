import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

const AppShell = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #f6f8fb 0%, #ffffff 100%);
  color: #222;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

const TopBar = styled.header`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(16,24,40,0.1);
  position: sticky;
  top: 0;
  z-index: 30;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #2563eb;
`;

const Content = styled.main`
  flex: 1 1 auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f9fafb;
  min-height: 0;
`;

const BottomNav = styled.nav`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #fff;
  border-top: 1px solid #ddd;
  position: sticky;
  bottom: 0;
  box-shadow: 0 -2px 8px rgba(16,24,40,0.05);
  z-index: 30;
`;

const NavItem = styled(Link)<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${(p) => (p.$active ? '#2563eb' : '#555')};
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s, color 0.2s;

  &:hover,
  &:focus-visible {
    color: #1d4ed8;
    background-color: #e0e7ff;
    outline: none;
  }
`;

const Icon = styled.span`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 4px;
`;

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'Smart Spot' }) => {
  const location = useLocation();

  return (
    <AppShell>
      <TopBar>
        <Title>{title}</Title>
        <div /> {/* Placeholder for future right side items */}
      </TopBar>

      <Content>{children}</Content>

      <BottomNav role="navigation" aria-label="Main navigation">
        <NavItem to="/home" $active={location.pathname === '/home'} aria-current={location.pathname === '/home' ? 'page' : undefined}>
          <Icon aria-hidden="true">🚗</Icon>
          Home
        </NavItem>
        <NavItem to="/qr" $active={location.pathname === '/qr'} aria-current={location.pathname === '/qr' ? 'page' : undefined}>
          <Icon aria-hidden="true">🔲</Icon>
          QR
        </NavItem>
        <NavItem to="/profile" $active={location.pathname === '/profile'} aria-current={location.pathname === '/profile' ? 'page' : undefined}>
          <Icon aria-hidden="true">👤</Icon>
          Profile
        </NavItem>
      </BottomNav>
    </AppShell>
  );
};

export default Layout;
