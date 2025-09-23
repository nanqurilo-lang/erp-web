import React from 'react';
import Link from 'next/link';

const Hr = () => {
  return (
    <div>
      <Link href="/hr/department">
        <button>
          Click here
        </button>
      </Link>
    </div>
  );
};

export default Hr;
