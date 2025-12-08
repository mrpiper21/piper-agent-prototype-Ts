interface PriceDisplayProps {
  total: number;
}

export function PriceDisplay({ total }: PriceDisplayProps) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        background: '#10b98115',
        border: '1px solid #10b98140',
        marginBottom: '20px',
      }}
    >
      <h3
        style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#10b981',
          margin: '0 0 8px 0',
        }}
      >
        Total Price
      </h3>
      <p
        style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#10b981',
          margin: 0,
        }}
      >
        GHC {total.toFixed(2)}
      </p>
    </div>
  );
}

