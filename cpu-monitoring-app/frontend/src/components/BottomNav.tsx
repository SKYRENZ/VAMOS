import { Link, useLocation } from "react-router-dom";
import BatteryIcon from "../assets/BatteryBtn.png";
import HomeIcon from "../assets/HomeBtn.png";
import NetworkIcon from "../assets/NetworkBtn.png";
import ActiveHome from "../assets/HomeBtnActive.png";
import ActiveBattery from "../assets/BatteryBtnActive.png";
import ActiveNetwork from "../assets/NetworkBtnActive.png";

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    {
      path: "/battery",
      label: "Battery",
      icon: BatteryIcon,
      activeIcon: ActiveBattery,
    },
    {
      path: "/home",
      label: "Home",
      icon: HomeIcon,
      activeIcon: ActiveHome,
    },
    {
      path: "/network",
      label: "Network",
      icon: NetworkIcon,
      activeIcon: ActiveNetwork,
    },
  ];

  return (
    <nav className="position-fixed bottom-0 start-0 w-100 bg-transparent text-white p-3 shadow-lg d-flex justify-content-center">
      <div className="d-flex justify-content-center w-50 gap-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="d-flex flex-column align-items-center text-decoration-none"
          >
            <img
              src={location.pathname === item.path ? item.activeIcon : item.icon}
              alt={`${item.label} Icon`}
              className="img-fluid"
              style={{
                width: item.path === "/home" ? "110px" : "100px",  // Home icon is bigger
                height: item.path === "/home" ? "110px" : "100px",
                objectFit: "contain"
              }}
            />
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
