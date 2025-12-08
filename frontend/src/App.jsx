import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage/LandingPage.jsx";
import RegisterUser from "./components/registerUser/registerUser.jsx";
import CustomerLogin from "./components/login/login.jsx";
import AdminDashboard from "./components/adminDashboard/adminDashboard.jsx";
import RegisterCarrier from "./components/registerCarrier/registerCarrier.jsx";
import ViewCarriers from "./components/viewCarriers/viewCarriers.jsx";
import ViewCarrierDetail from "./components/viewCarriers/viewCarrierDetail.jsx";
import AdminRoute from "./components/adminRoute/AdminRoute.jsx";
import RegisterFlight from "./components/registerFlight/registerFlight.jsx";
import ViewFlights from "./components/viewFlights/viewFlights.jsx";
import ViewFlightDetail from "./components/viewFlights/viewFlightDetail.jsx";
import UpdateFlight from "./components/updateFlight/updateFlight.jsx";
import UpdateCarrier from "./components/updateCarrier/updateCarrier.jsx";
import CustomerDashboard from "./components/customerDashboard/customerDashboard.jsx"
import SearchingPage from "./components/searchFlight/searchFlight.jsx";
import CancelBooking from "./components/cancelBooking/cancelBooking.jsx";
import BookingHistory from "./components/bookingHistory/bookingHistory.jsx";
import Profile from "./components/profile/profile.jsx";
import Bookings from "./components/bookings/bookings.jsx";  
import Payment from "./components/payment/payment.jsx";
import ViewBookings from "./components/viewBookings/viewBookings.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import ResetPassword from "./components/ResetPassword.jsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/carriers/register" element={<AdminRoute><RegisterCarrier /></AdminRoute>} />
        <Route path="/admin/carriers" element={<AdminRoute><ViewCarriers /></AdminRoute>} />
        <Route path="/admin/carriers/:id" element={<AdminRoute><ViewCarrierDetail /></AdminRoute>} />
        <Route path="/admin/flights/register" element={<AdminRoute><RegisterFlight /></AdminRoute>} />
        <Route path="/admin/flights" element={<AdminRoute><ViewFlights /></AdminRoute>} />
        <Route path="/admin/flights/:id" element={<AdminRoute><ViewFlightDetail /></AdminRoute>} />
        <Route path="/admin/flights/update" element={<AdminRoute><UpdateFlight /></AdminRoute>} />
        <Route path="/admin/carriers/update" element={<AdminRoute><UpdateCarrier /></AdminRoute>} />
        <Route path="/dashboard" element={<CustomerDashboard></CustomerDashboard>}/>
        <Route path="/customer/searchflight" element={<SearchingPage />} />
        <Route path="/customer/cancelBooking" element={<CancelBooking />} />
        <Route path="/customer/allbookings" element={<BookingHistory />} />
        <Route path="/customer/profile" element={<Profile />} />
        <Route path="/customer/Bookings" element={<Bookings/>}/>
        <Route path="/viewflights" element={<ViewFlights />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/admin/viewbookings" element={<ViewBookings />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
} 
export default App;
