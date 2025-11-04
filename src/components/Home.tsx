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
  slotid4: boolean;
  slotid5: boolean;
}

interface ReservationStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
  bookingCode?: string;
  spotId?: string;
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const SpotCard = styled.div`
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(16,24,40,0.06);
  background-color: white;
  user-select: none;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 10px 30px rgba(16,24,40,0.12);
  }

  @media (max-width: 640px) {
    padding: 14px;
    border-radius: 8px;
  }
`;

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 8px;
`;

const SlotButton = styled.button<{ isAvailable: boolean }>`
  padding: 8px;
  border: none;
  border-radius: 6px;
  background-color: ${props => props.isAvailable ? '#10B981' : '#EF4444'};
  color: white;
  font-size: 12px;
  cursor: ${props => props.isAvailable ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.isAvailable ? 1 : 0.7};
  transition: all 0.2s;

  &:hover {
    transform: ${props => props.isAvailable ? 'scale(1.05)' : 'none'};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ReservationStatus = styled.div<{ success?: boolean }>`
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => props.success ? '#DEF7EC' : '#FEE2E2'};
  color: ${props => props.success ? '#03543F' : '#9B1C1C'};
  margin-top: 12px;
  font-size: 14px;
`;

const BookingCode = styled.div`
  background: #1E293B;
  color: #E2E8F0;
  padding: 12px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 16px;
  text-align: center;
  margin-top: 8px;
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
          slotid4: data.slotid4 ?? true,
          slotid5: data.slotid5 ?? true,
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
      // Start a transaction to handle reservation
      await runTransaction(db, async (transaction) => {
        // 1. Read all required documents first
        const userDoc = doc(db, 'users', user.uid);
        const spotDoc = doc(db, 'parkslot', spotId);
        const adminDoc = doc(db, 'users', 'admin123');
        const reservationRef = doc(collection(db, 'reservations'));

        // 2. Get all documents in parallel for efficiency
        const [userSnapshot, spotSnapshot, adminSnapshot] = await Promise.all([
          transaction.get(userDoc),
          transaction.get(spotDoc),
          transaction.get(adminDoc)
        ]);

        // 3. Extract and validate data
        const userData = userSnapshot.data();
        const spotData = spotSnapshot.data();
        const adminData = adminSnapshot.data();
        const currentBalance = userData?.wallet?.balance || 0;

        // 4. Validate conditions
        if (currentBalance < 5) {
          throw new Error('Insufficient balance. Need ₹5 for reservation.');
        }

        if (!spotData || !spotData[slotKey]) {
          throw new Error('Slot no longer available.');
        }

        // 5. Generate reservation data
        const bookingCode = `${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);

        // 6. Perform all writes after all reads and validations
        transaction.set(reservationRef, {
          user_id: user.uid,
          spot_id: spotId,
          slot_id: slotKey,
          created_at: serverTimestamp(),
          expires_at: expiresAt,
          status: 'active',
          reservation_fee: 5,
          booking_code: bookingCode
        });

        transaction.update(spotDoc, {
          [slotKey]: false,
          available: spotData.available - 1
        });

        transaction.update(userDoc, {
          'wallet.balance': currentBalance - 5
        });

        transaction.update(adminDoc, {
          'wallet.balance': (adminData?.wallet?.balance || 0) + 5,
          'wallet.total_collected': (adminData?.wallet?.total_collected || 0) + 5
        });

        setReservationStatus({
          loading: false,
          error: null,
          success: true,
          spotId,
          bookingCode
        });

        // Refresh parking spots data
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
        {/* <div>
          <QRButton to="/qr">Show QR</QRButton>
          <ProfileButton to="/profile">Profile</ProfileButton>
          <LogoutButton onClick={logout}>Logout</LogoutButton>
        </div> */}
      </Header>

      {loading ? (
        <p>Loading parking spots...</p>
      ) : (
        <SpotsList>
          {parkingSpots.map((spot) => {


            return (
              <SpotCard key={spot.id}>
                <h3>{spot.name}</h3>
                <p>Available Slots: {spot.available}</p>
                <p className="text-sm text-gray-600">
                  Location: {spot.location.lat.toFixed(6)}, {spot.location.long.toFixed(6)}
                </p>
                
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
                  <ReservationStatus>
                    {reservationStatus.error}
                  </ReservationStatus>
                )}
                
                {reservationStatus.success && spot.id === reservationStatus.spotId && (
                  <ReservationStatus success>
                    Slot reserved successfully!
                    <BookingCode>
                      Booking Code: {reservationStatus.bookingCode}
                    </BookingCode>
                  </ReservationStatus>
                )}
              </SpotCard>
            );
          })}
        </SpotsList>
      )}
    </HomeContainer>
  );
};

export default Home;
