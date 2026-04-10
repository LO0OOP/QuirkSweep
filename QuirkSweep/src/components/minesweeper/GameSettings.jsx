import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const PRESETS = [
  { name: '简单', rows: 9, cols: 9, mines: 10 },
  { name: '中等', rows: 16, cols: 16, mines: 40 },
  { name: '困难', rows: 16, cols: 30, mines: 99 },
];

const GameSettings = ({ settings, onSettingsChange, onNewGame }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [open, setOpen] = useState(false);

  const handlePresetClick = (preset) => {
    setLocalSettings({
      ...localSettings,
      rows: preset.rows,
      cols: preset.cols,
      mineCount: preset.mines,
    });
  };

  const handleSave = () => {
    // 验证设置
    const maxMines = localSettings.rows * localSettings.cols - 1;
    const validMineCount = Math.min(localSettings.mineCount, maxMines);
    
    const newSettings = {
      ...localSettings,
      mineCount: validMineCount,
    };
    
    onSettingsChange(newSettings);
    onNewGame(newSettings);
    setOpen(false);
  };

  const handleInputChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    setLocalSettings(prev => ({
      ...prev,
      [field]: Math.max(1, numValue),
    }));
  };

  const handleNoGuessChange = (checked) => {
    setLocalSettings(prev => ({
      ...prev,
      noGuessMode: checked,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="w-4 h-4" />
          设置
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>游戏设置</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 预设选项 */}
          <div className="flex gap-2 justify-center">
            {PRESETS.map(preset => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className={`
                  ${localSettings.rows === preset.rows && 
                    localSettings.cols === preset.cols && 
                    localSettings.mineCount === preset.mines 
                    ? 'bg-primary text-primary-foreground' : ''}
                `}
              >
                {preset.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows">行数</Label>
              <Input
                id="rows"
                type="number"
                min={5}
                max={30}
                value={localSettings.rows}
                onChange={(e) => handleInputChange('rows', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cols">列数</Label>
              <Input
                id="cols"
                type="number"
                min={5}
                max={50}
                value={localSettings.cols}
                onChange={(e) => handleInputChange('cols', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mines">地雷数</Label>
              <Input
                id="mines"
                type="number"
                min={1}
                max={localSettings.rows * localSettings.cols - 1}
                value={localSettings.mineCount}
                onChange={(e) => handleInputChange('mineCount', e.target.value)}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            最大地雷数: {localSettings.rows * localSettings.cols - 1}
          </div>

          {/* 无猜模式开关 */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">无猜模式</div>
                <div className="text-xs text-gray-500">
                  确保棋盘可通过逻辑推理解决，无需猜测
                </div>
              </div>
            </div>
            <Switch
              checked={localSettings.noGuessMode}
              onCheckedChange={handleNoGuessChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            开始新游戏
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameSettings;
