import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import Home from "./routes/Home";
import Login from "./routes/Login";
import SalesYear from "./routes/SalesYear";
import SalesMonth from "./routes/SalesMonth";
import Schedules from "./routes/Schedules";
import Products from "./routes/Products";
import Join from "./routes/Join";
import Members from "./routes/Members";
import { useUserStore } from "./store/store";
import PrivateRoute from "./components/PrivateRoute";
import { useEffect } from "react";
import axios from "axios";
import Inquiry from "./routes/Inquiry";
import Center from "./routes/Center";
import ClientCallLog from "./routes/ClientCallLog";
import MembersCheckIn from "./routes/MembersCheckIn";
import MembersCheckInList from "./routes/MembersCheckInList";
import CenterList from "./routes/CenterList";
import ScheduleDetail from "./routes/ScheduleDetail";
import UpdateLogs from "./routes/UpdateLogs";
import Notice from "./routes/Notice";
import Guideline from "./routes/Guideline";
import Videos from "./routes/Videos";
import Setting from "./routes/Setting";
import AddUser from "./routes/AddUser";
import ScrollToTop from "./components/ScrollToTop";
import AttendancePage from "./routes/AttendancePage";
import MembersOrderBulkRegister from "./routes/MembersOrderBulkRegister";
import MembersOrderBulkExtend from "./routes/MembersOrderBulkExtend";
import Locker from "./routes/Locker";
import MemberApp from "./routes/app";
import AllCenterMembers from "./routes/AllCenterMembers";
import ReservationManagement from "./routes/ReservationManagement";

const App: React.FC = () => {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/check-token`,
          {
            withCredentials: true,
          }
        );
        setUser(res.data);
      } catch (error) {
        localStorage.removeItem("accessToken");
        return;
      }
    };

    verifyToken();
  }, [setUser]);

  return (
    <div className="App">
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/members"
            element={
              <PrivateRoute>
                <Members />
              </PrivateRoute>
            }
          />
          <Route
            path="/join"
            element={
              <PrivateRoute>
                <Join />
              </PrivateRoute>
            }
          />
          <Route
            path="/sales_year"
            element={
              <PrivateRoute>
                <SalesYear />
              </PrivateRoute>
            }
          />
          <Route
            path="/sales_month/:date"
            element={
              <PrivateRoute>
                <SalesMonth />
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <Products />
              </PrivateRoute>
            }
          />
          <Route
            path="/schedules"
            element={
              <PrivateRoute>
                <Schedules />
              </PrivateRoute>
            }
          />
          <Route
            path="/schedules/:id"
            element={
              <PrivateRoute>
                <ScheduleDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/inquiry"
            element={
              <PrivateRoute>
                <Inquiry />
              </PrivateRoute>
            }
          />
          <Route
            path="/client_call_log"
            element={
              <PrivateRoute>
                <ClientCallLog />
              </PrivateRoute>
            }
          />
          <Route path="/videos" element={<Videos />} />
          <Route
            path="/center"
            element={
              <PrivateRoute>
                <Center />
              </PrivateRoute>
            }
          />
          <Route
            path="/notice/update"
            element={
              <PrivateRoute>
                <UpdateLogs />
              </PrivateRoute>
            }
          />
          <Route
            path="/notice/notice"
            element={
              <PrivateRoute>
                <Notice />
              </PrivateRoute>
            }
          />
          <Route
            path="/notice/guideline"
            element={
              <PrivateRoute>
                <Guideline />
              </PrivateRoute>
            }
          />
          <Route
            path="/members/checkinlist"
            element={
              <PrivateRoute>
                <MembersCheckInList />
              </PrivateRoute>
            }
          />
          <Route
            path="/members/attendance"
            element={
              <PrivateRoute>
                <AttendancePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/setting"
            element={
              <PrivateRoute>
                <Setting />
              </PrivateRoute>
            }
          />
          <Route path="/members/checkin" element={<MembersCheckIn />} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route
            path="/center_list"
            element={
              <PrivateRoute>
                <CenterList />
              </PrivateRoute>
            }
          />
          <Route
            path="/add_user"
            element={
              <PrivateRoute>
                <AddUser />
              </PrivateRoute>
            }
          />
          <Route
            path="/members/membersOrderBulkRegister"
            element={
              <PrivateRoute>
                <MembersOrderBulkRegister />
              </PrivateRoute>
            }
          />
          <Route
            path="/members/membersOrderBulkExtend"
            element={
              <PrivateRoute>
                <MembersOrderBulkExtend />
              </PrivateRoute>
            }
          />
          <Route
            path="/locker"
            element={
              <PrivateRoute>
                <Locker />
              </PrivateRoute>
            }
          />
          <Route
            path="/app/*"
            element={
              <PrivateRoute>
                <MemberApp />
              </PrivateRoute>
            }
          />
          <Route
            path="/members/allMemberList"
            element={
              <PrivateRoute>
                <AllCenterMembers />
              </PrivateRoute>
            }
          />
          <Route
            path="/members/reservation"
            element={
              <PrivateRoute>
                <ReservationManagement />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
