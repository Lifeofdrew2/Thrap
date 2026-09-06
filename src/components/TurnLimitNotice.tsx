import type { HumanRoute } from "../api/types";
import type { AppCopy } from "../app/i18n";

interface TurnLimitNoticeProps {
  humanRoute: HumanRoute;
  copy: AppCopy;
}

export function TurnLimitNotice({ humanRoute, copy }: TurnLimitNoticeProps) {
  return (
    <main className="page-wrap" aria-labelledby="turn-limit-heading">
      <div className="turn-limit-state">
        <p className="eyebrow">{copy.turnLimitEyebrow}</p>
        <h1 id="turn-limit-heading">{copy.turnLimitHeading}</h1>
        <p>{copy.turnLimitBody}</p>
        <a className="human-route" href={humanRoute.actionTarget}>
          <span className="human-route__label">{copy.connectCounsellor} {humanRoute.role}</span>
          <span className="human-route__channel">via {humanRoute.channelLabel}</span>
        </a>
      </div>
    </main>
  );
}
