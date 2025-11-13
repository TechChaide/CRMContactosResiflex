

'use client';

import Image from 'next/image';

// Página por defecto: fondo gris claro y logo centrado.
export default function DashboardPage() {
    return (
        <div className="flex flex-1 items-center justify-center min-h-full bg-gray-100">
            <div className="flex flex-col items-center gap-6">
                <Image
                    src="/img/icon.png"
                    alt="Chaide Logo"
                    width={260}
                    height={80}
                    priority
                    className="select-none"
                />
            </div>
        </div>
    );
}
