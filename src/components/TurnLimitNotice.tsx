import type { HumanRoute } from "../api/types";

interface TurnLimitNoticeProps {
  humanRoute: HumanRoute;
}

export function TurnLimitNotice({ humanRoute }: TurnLimitNoticeProps) {
  return (
    <main className="page-wrap" aria-labelledby="turn-limit-heading">
      <div className="turn-limit-state">
        <p className="eyebrow">Session complete</p>
        <h1 id="turn-limit-heading">You've reached the end of this session</h1>
        <p>
          Thank you for opening up today. Continuing this conversation with a trained professional
          can help you go deeper. A licensed counsellor is here to support you.
        </p>
        <a className="human-route" href={humanRoute.actionTarget}>
          <span className="human-route__label">Connect with {humanRoute.role}</span>
          <span className="human-route__channel">via {humanRoute.channelLabel}</span>
        </a>
      </div>
    </main>
  );
}
