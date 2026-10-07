'use client';
export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
    >
      Print ID Card
    </button>
  );
}
