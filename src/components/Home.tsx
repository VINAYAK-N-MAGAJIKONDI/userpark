import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { collection, doc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import styled, { keyframes } from 'styled-components';

// === Animations ===
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// === Types ===
interface ParkingSpot {
  id: string;
  location?: { lat?: number; long?: number };
  name?: string;
  available?: number;
  slotid1?: boolean;
  slotid2?: boolean;
  slotid3?: boolean;
  slotid4?: boolean;
  slotid5?: boolean;
}

interface ReservationState {
  loading: boolean;
  error: string | null;
  success: boolean;
  bookingCode?: string;
  spotId?: string;
}

// === Styled Components ===
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%);
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
  margin-bottom: 9px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SpotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
`;

const SpotCard = styled.div`
  background: linear-gradient(100deg, #fff 50%, #e0f7fa 100%);
  border: 2px solid #bae6fd;
  border-radius: 18px;
  box-shadow: 0 8px 22px rgba(30, 41, 59, 0.13);
  padding: 26px;
  transition: all 0.3s;
  position: relative;
  animation: ${fadeIn} 0.3s ease forwards;

  &:hover {
    transform: scale(1.03) translateY(-3px);
    box-shadow: 0 18px 40px rgba(16, 185, 129, 0.09);
    border-color: #22d3ee;
  }
`;

const SpotName = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 6px;
`;

const SpotDetails = styled.p`
  color: #64748b;
  font-size: 14px;
  margin: 4px 0;
`;

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 12px;
`;

const SlotButton = styled.button<{ isAvailable: boolean }>`
  padding: 12px 0;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: ${(p) => (p.isAvailable ? '#2563eb' : '#ef4444')};
  box-shadow: ${(p) => (p.isAvailable ? '0 2px 4px rgba(37,99,235,0.05)' : 'none')};
  cursor: ${(p) => (p.isAvailable ? 'pointer' : 'not-allowed')};
  opacity: ${(p) => (p.isAvailable ? 1 : 0.55)};
  transition: all 0.25s;

  &:hover {
    filter: brightness(1.1);
    transform: ${(p) => (p.isAvailable ? 'scale(1.07)' : 'none')};
  }
`;

const StatusCard = styled.div<{ success?: boolean }>`
  background: ${(p) => (p.success ? 'linear-gradient(90deg, #d1fae5 70%, #fef3c7 100%)' : '#fee2e2')};
  color: ${(p) => (p.success ? '#3b6e2f' : '#991b1b')};
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: ${fadeIn} 0.3s ease;
`;

const BookingCode = styled.div`
  background: linear-gradient(90deg, #1e293b 60%, #6366f1 100%);
  color: #f3f4f6;
  padding: 12px;
  border-radius: 10px;
  font-family: monospace;
  font-size: 17px;
  text-align: center;
  margin-top: 8px;
  box-shadow: 0 1px 4px rgba(99,102,241,0.15);
`;

const LoadingIndicator = styled.div`
  font-size: 18px;
  text-align: center;
  color: #2563eb;
  animation: ${pulse} 1.5s infinite ease-in-out;
  margin-top: 60px;
`;

// === Main Component ===
const Home: React.FC = () => {
  const { user } = useAuth();
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservationStatus, setReservationStatus] = useState<ReservationState>({
    loading: false,
    error: null,
    success: false,
  });

  const fetchParkingSpots = useCallback(async () => {
    setLoading(true);
    try {
      const spotsSnapshot = await getDocs(collection(db, 'parkslot'));
      const data = spotsSnapshot.docs.map((docSnap) => {
        const spot = docSnap.data();
        return {
          id: docSnap.id,
          location: {
            lat: spot?.lat ?? 0,
            long: spot?.long ?? 0,
          },
          name: spot?.name ?? 'Unknown',
          available: spot?.available ?? 0,
          slotid1: spot?.slotid1 ?? true,
          slotid2: spot?.slotid2 ?? true,
          slotid3: spot?.slotid3 ?? true,
          slotid4: spot?.slotid4 ?? true,
          slotid5: spot?.slotid5 ?? true,
        };
      });
      setParkingSpots(data);
    } catch (e) {
      console.error('Error fetching parking spots:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParkingSpots();
  }, [fetchParkingSpots]);

  const handleReserveSlot = async (spotId: string, slotKey: string) => {
    if (!user) return;
    setReservationStatus({ loading: true, error: null, success: false, spotId });

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = doc(db, 'users', user.uid);
        const spotDoc = doc(db, 'parkslot', spotId);
        const reservationRef = doc(collection(db, 'reservations'));

        const [userSnap, spotSnap] = await Promise.all([
          transaction.get(userDoc),
          transaction.get(spotDoc),
        ]);

        const userData = userSnap.data();
        const spotData = spotSnap.data();

        if (!userData?.wallet)
          throw new Error('User wallet not found. Please set up your account.');

        const userBalance = userData.wallet.balance || 0;
        if (userBalance < 5)
          throw new Error('Insufficient balance. ₹5 required to reserve.');

        if (!spotData?.[slotKey])
          throw new Error('Slot no longer available.');

        const bookingCode = `${Date.now().toString(36)}${Math.random()
          .toString(36)
          .substring(2, 7)}`.toUpperCase();

        // Perform all updates
        transaction.set(reservationRef, {
          user_id: user.uid,
          spot_id: spotId,
          slot_id: slotKey,
          created_at: serverTimestamp(),
          booking_code: bookingCode,
        });

        transaction.update(spotDoc, {
          [slotKey]: false,
          available: (spotData.available || 1) - 1,
        });

        transaction.update(userDoc, {
          'wallet.balance': userBalance - 5,
        });

        setReservationStatus({
          loading: false,
          error: null,
          success: true,
          spotId,
          bookingCode,
        });
      });

      // Refresh after reservation
      fetchParkingSpots();
    } catch (e: any) {
      setReservationStatus({
        loading: false,
        error: e.message,
        success: false,
        spotId,
      });
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <PageContainer>
      <Header>
        <Title>🚗 Available Parking Spots</Title>
      </Header>

      {loading ? (
        <LoadingIndicator>Fetching parking data...</LoadingIndicator>
      ) : (
        <SpotsGrid>
          {parkingSpots.map((spot) => (
            <SpotCard key={spot.id}>
              <SpotName>{spot.name}</SpotName>
              <SpotDetails>
                Available Slots: {spot.available ?? 0}
              </SpotDetails>
              <SpotDetails>
                📍 Location:{' '}
                {spot.location
                  ? `${spot.location.lat?.toFixed(6)}, ${spot.location.long?.toFixed(6)}`
                  : 'N/A'}
              </SpotDetails>

              <SlotGrid>
                {[1, 2, 3, 4, 5].map((num) => {
                  const slotKey = `slotid${num}` as keyof ParkingSpot;
                  const isAvailable = Boolean(spot[slotKey]);
                  return (
                    <SlotButton
                      key={num}
                      isAvailable={isAvailable}
                      disabled={!isAvailable || reservationStatus.loading}
                      onClick={() => handleReserveSlot(spot.id, slotKey)}
                    >
                      Slot {num}
                    </SlotButton>
                  );
                })}
              </SlotGrid>

              {reservationStatus.error && spot.id === reservationStatus.spotId && (
                <StatusCard>{reservationStatus.error}</StatusCard>
              )}

              {reservationStatus.success && spot.id === reservationStatus.spotId && (
                <StatusCard success>
                  ✅ Slot reserved successfully!
                  <BookingCode>{reservationStatus.bookingCode}</BookingCode>
                </StatusCard>
              )}
            </SpotCard>
          ))}
        </SpotsGrid>
      )}
    </PageContainer>
  );
};

export default Home;

// Ensure this file is a module for TypeScript isolated mode
export {};
