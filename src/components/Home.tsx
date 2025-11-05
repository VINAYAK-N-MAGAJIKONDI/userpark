// import React, { useEffect, useState, useCallback } from 'react';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { collection, doc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import styled from 'styled-components';

interface ParkingSpot {
  id: string;
  location: {
    lat: number;
    long: number;
  };
  name: string;
  available: number;
  slotid1: boolean;
  slotid2: boolean;
  slotid3: boolean;

  address: string;
}

interface ReservationStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
  bookingCode?: string;
  spotId?: string;
}

// 🎨 Modern Android-Inspired Styling
const HomeContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%);
  color: #111827;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h1 {
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
  }
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ActionButton = styled(Link)<{ color?: string }>`
  padding: 10px 16px;
  background-color: ${({ color }) => color || '#2563eb'};
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-2px);
    background-color: ${({ color }) => color || '#1d4ed8'};
  }
`;

const LogoutButton = styled.button`
  padding: 10px 16px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.25);

  &:hover {
    background-color: #dc2626;
    transform: translateY(-2px);
  }
`;

const SpotsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
`;

const SpotCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer; /* 👈 makes it clickable */

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  p {
    color: #6b7280;
    font-size: 14px;
  }
`;


const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 10px;
`;

const SlotButton = styled.button<{ isAvailable: boolean }>`
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  background: ${({ isAvailable }) => (isAvailable ? '#22c55e' : '#ef4444')};
  color: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  cursor: ${({ isAvailable }) => (isAvailable ? 'pointer' : 'not-allowed')};
  opacity: ${({ isAvailable }) => (isAvailable ? 1 : 0.6)};
  transition: all 0.2s ease;

  &:hover {
    transform: ${({ isAvailable }) => (isAvailable ? 'scale(1.07)' : 'none')};
  }

  &:active {
    transform: ${({ isAvailable }) => (isAvailable ? 'scale(0.96)' : 'none')};
  }
`;

const ReservationStatusBox = styled.div<{ success?: boolean }>`
  margin-top: 12px;
  padding: 14px;
  border-radius: 10px;
  background-color: ${({ success }) => (success ? '#dcfce7' : '#fee2e2')};
  color: ${({ success }) => (success ? '#166534' : '#991b1b')};
  font-size: 14px;
  font-weight: 500;
`;

const BookingCode = styled.div`
  margin-top: 8px;
  background: #1e293b;
  color: #e2e8f0;
  font-family: 'Roboto Mono', monospace;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
  letter-spacing: 1px;
`;

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>({
    loading: false,
    error: null,
    success: false
  });

  const fetchParkingSpots = useCallback(async () => {
    setLoading(true);
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
          available: data.available || 0,
          slotid1: data.slotid1 ?? true,
          slotid2: data.slotid2 ?? true,
          slotid3: data.slotid3 ?? true,

          address: data.address || 'Unknown',
        };
      });

      setParkingSpots(spotsData);
    } catch (error) {
      console.error('Error fetching parking spots:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParkingSpots();
  }, [fetchParkingSpots]);

  const handleReserveSlot = async (spotId: string, slotKey: string) => {
    if (!user) return;
    
    setReservationStatus({
      loading: true,
      error: null,
      success: false,
      spotId
    });

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = doc(db, 'users', user.uid);
        const spotDoc = doc(db, 'parkslot', spotId);
        const adminDoc = doc(db, 'users', 'admin123');
        const reservationRef = doc(collection(db, 'reservations'));

        const [userSnapshot, spotSnapshot, adminSnapshot] = await Promise.all([
          transaction.get(userDoc),
          transaction.get(spotDoc),
          transaction.get(adminDoc)
        ]);

        const userData = userSnapshot.data();
        const spotData = spotSnapshot.data();
        const adminData = adminSnapshot.data();
        const currentBalance = userData?.wallet?.balance || 0;

        if (currentBalance < 50) throw new Error('Insufficient balance. Need ₹50 for reservation.');
        if (!spotData || !spotData[slotKey]) throw new Error('Slot no longer available.');

        const bookingCode = `${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);

        transaction.set(reservationRef, {
          user_id: user.uid,
          spot_id: spotId,
          slot_id: slotKey,
          created_at: serverTimestamp(),
          expires_at: expiresAt,
          status: 'active',
          reservation_fee: 50,
          booking_code: bookingCode
        });

        transaction.update(spotDoc, {
          [slotKey]: false,
          available: spotData.available - 1
        });

        transaction.update(userDoc, {
          'wallet.balance': currentBalance - 50
        });

        transaction.update(adminDoc, {
          'wallet.balance': (adminData?.wallet?.balance || 0) + 50,
          'wallet.total_collected': (adminData?.wallet?.total_collected || 0) + 50
        });

        setReservationStatus({
          loading: false,
          error: null,
          success: true,
          spotId,
          bookingCode
        });

        fetchParkingSpots();
      });
    } catch (error: any) {
      setReservationStatus({
        loading: false,
        error: error.message || 'Failed to reserve slot',
        success: false,
        spotId
      });
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <HomeContainer>
      <Header>
        <h1>Available Parking Spots</h1>
      </Header>

      {loading ? (
        <p>Loading parking spots...</p>
      ) : (
        <SpotsList>
{parkingSpots.map((spot) => (
  <SpotCard
    key={spot.id}
    onClick={() =>
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${spot.location.lat},${spot.location.long}`,
        '_blank'
      )
    }
  >
    <h3>{spot.name}</h3>
    <p>Available Slots: {spot.available}</p>
    <p>Location: {spot.address}</p>

    <SlotGrid>
      {[1, 2, 3].map((num) => {
        const slotKey = `slotid${num}` as keyof ParkingSpot;
        const isAvailable = Boolean(spot[slotKey]);
        return (
          <SlotButton
            key={num}
            isAvailable={isAvailable}
            disabled={!isAvailable || reservationStatus.loading}
            onClick={(e) => {
              e.stopPropagation(); // 👈 Prevent opening maps
              handleReserveSlot(spot.id, slotKey);
            }}
          >
            Slot {num}
          </SlotButton>
        );
      })}
    </SlotGrid>

    {reservationStatus.error && spot.id === reservationStatus.spotId && (
      <ReservationStatusBox>
        {reservationStatus.error}
      </ReservationStatusBox>
    )}

    {reservationStatus.success && spot.id === reservationStatus.spotId && (
      <ReservationStatusBox success>
        Slot reserved successfully!
        <BookingCode>
          Booking Code: {reservationStatus.bookingCode}
        </BookingCode>
      </ReservationStatusBox>
    )}
  </SpotCard>
))}

        </SpotsList>
      )}
    </HomeContainer>
  );
};

export default Home;
