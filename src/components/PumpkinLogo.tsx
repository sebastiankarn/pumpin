import logo from "../assets/logo.svg";

export default function PumpkinLogo({
  className = "w-8 h-8",
}: {
  className?: string;
}) {
  return <img src={logo} alt="Pumpin logo" className={className} />;
}
