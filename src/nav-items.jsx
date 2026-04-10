import { HomeIcon, Bomb, Sword } from "lucide-react";
import Index from "./pages/Index.jsx";
import Minesweeper from "./pages/Minesweeper.jsx";
import AdventureMode from "./pages/AdventureMode.jsx";

/**
* Central place for defining the navigation items. Used for navigation components and routing.
*/
export const navItems = [
{
    title: "首页",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
},
{
    title: "经典模式",
    to: "/minesweeper",
    icon: <Bomb className="h-4 w-4" />,
    page: <Minesweeper />,
},
{
    title: "闯关模式",
    to: "/adventure",
    icon: <Sword className="h-4 w-4" />,
    page: <AdventureMode />,
},
];
