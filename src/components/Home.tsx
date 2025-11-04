import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import styled from 'styled-components';

interface ParkingSpot {
  id: string;
  location: {
    lat: number;
    long: number;
  };
  name: string;
  slots: number;
}

const HomeContainer = styled.div`
  padding: 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const LogoutButton = styled.button`
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #c82333;
  }
`;

const ProfileButton = styled(Link)`
  padding: 8px 12px;
  margin-right: 12px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0069d9;
  }
`;

const QRButton = styled(Link)`
  padding: 8px 12px;
  margin-right: 12px;
  background-color: #28a745;
  color: white;
  text-decoration: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
`;

const SpotsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const SpotCard = styled.div`
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: white;
  cursor: pointer;
  user-select: none;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  }
`;

const Home = () => {
  const { user, logout } = useAuth();
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchParkingSpots = async () => {
    try {
      const spotsCollection = collection(db, 'parkslot');
      const spotsSnapshot = await getDocs(spotsCollection);

      const spotsData = spotsSnapshot.docs.map((docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    location: {
      lat: data.lat || 0,
      long: data.long || 0,
    },
    name: data.name || 'Unknown',
    slots: data.available || 0,
  };
});



      setParkingSpots(spotsData);
    } catch (error) {
      console.error('Error fetching parking spots:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchParkingSpots();
}, []);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <HomeContainer>
      <Header>
        <h1>Available Parking Spots</h1>
        <div>
          <QRButton to="/qr">Show QR</QRButton>
          <ProfileButton to="/profile">Profile</ProfileButton>
          <LogoutButton onClick={logout}>Logout</LogoutButton>
        </div>
      </Header>

      {loading ? (
        <p>Loading parking spots...</p>
      ) : (
        <SpotsList>
          {parkingSpots.map((spot) => {
            const handleClick = () => {
              const lat = spot.location.lat;
              const lng = spot.location.long;
              const dest = `${lat},${lng}`;
              const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
              console.log('Opening Google Maps for spot:', spot.id, { lat, lng, url });
              window.open(url, '_blank', 'noopener');
            };

            return (
              <SpotCard
                key={spot.id}
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleClick();
                }}
              >
                <h3>{spot.name}</h3>
                <p>Available Slots: {spot.slots}</p>
                <p>
                  Location: {spot.location.lat.toFixed(6)}, {spot.location.long.toFixed(6)}
                </p>
              </SpotCard>
            );
          })}
        </SpotsList>
      )}
    </HomeContainer>
  );
};

export default Home;
