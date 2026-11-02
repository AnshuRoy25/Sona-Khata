import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="page">
      <div className="empty-block">
        <p>This page does not exist.</p>
        <Link to="/" className="btn">
          Go to overview
        </Link>
      </div>
    </div>
  );
}
