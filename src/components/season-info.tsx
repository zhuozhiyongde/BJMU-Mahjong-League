interface SeasonInfoProps {
  hanchans: number;
}

export function SeasonInfo({ hanchans }: SeasonInfoProps) {
  return (
    <div className="text-center mb-4 p-3 bg-primary/5 rounded-lg">
      <p className="text-lg font-medium text-foreground max-sm:text-sm">
        该赛季已进行{hanchans}个半庄，请各位选手加油ヾ(°∇°)ノ゙
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        计分：素点=(终局点数-25000)/1000；积分=素点+顺位点-5（顺位点：1位+50，2位+10，3位-10，4位-30；同分平分）
      </p>
    </div>
  );
}
