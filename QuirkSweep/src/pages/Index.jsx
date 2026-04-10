import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bomb, Sword, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
            <Bomb className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            扫雷游戏
          </h1>
          <p className="text-xl text-gray-600 mb-2">经典益智游戏，挑战你的逻辑思维</p>
          <p className="text-sm text-gray-500">经典模式 · 闯关模式 · 云端排行榜</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/minesweeper">
            <Button size="lg" variant="outline" className="gap-2 px-8">
              <Bomb className="w-5 h-5" />
              经典模式
            </Button>
          </Link>
          <Link to="/adventure">
            <Button size="lg" className="gap-2 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Sword className="w-5 h-5" />
              闯关模式
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 text-sm text-gray-500">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="font-semibold text-primary mb-1">🎮 经典模式</div>
            <div>传统扫雷玩法，支持自定义设置、历史记录和云端排行榜</div>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="font-semibold text-purple-600 mb-1">⚔️ 闯关模式</div>
            <div>限时挑战，包含生命系统、特殊格子和道具机制</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
