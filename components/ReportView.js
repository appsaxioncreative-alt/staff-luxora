// What the worker counted when the items came back to base.
export default function ReportView({ report }) {
  if (!report) return null;
  return (
    <div className="report">
      {report.hasDifference ? (
        <div className="msg warn">Some items did not come back. The office can see this report.</div>
      ) : (
        <div className="msg ok">Every item came back in full.</div>
      )}
      <ul className="rows">
        {report.items.map((i) => {
          const short = i.assigned - i.returned;
          return (
            <li key={i.itemId} className={short > 0 ? "row short" : "row"}>
              <div className="row-main">
                <span className="row-name">{i.name}</span>
                <span className="num">{i.returned} / {i.assigned}</span>
              </div>
              {short > 0 && (
                <p className="row-detail">
                  {i.broken > 0 && <span className="tag broken">{i.broken} broken</span>}
                  {i.missing > 0 && <span className="tag missing">{i.missing} missing</span>}
                  <span className="row-note">{i.note}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
