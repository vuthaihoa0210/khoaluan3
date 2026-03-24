'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image src="/logo.png" alt="TravelEasy Logo" width={36} height={36} style={{ borderRadius: 8 }} />
          <span className="text-2xl font-bold tracking-tight">TravelEasy</span>
        </Link>
        <nav className="flex space-x-4">
          <Link href="/" className="hover:opacity-80">Trang Chủ</Link>
          <Link href="/flights" className="hover:opacity-80">Đặt Vé Máy Bay</Link>
          <Link href="/tours" className="hover:opacity-80">Tour Du Lịch</Link>
          <Link href="/hotels" className="hover:opacity-80">Đặt Phòng Khách Sạn</Link>
          {session ? (
            <div className="relative group cursor-pointer">
              <span className="hover:opacity-80 flex items-center gap-1">
                Chào, {session.user?.name} 
                <span className="text-xs">▼</span>
              </span>
              <div className="absolute right-0 top-full pt-4 w-48 z-50 hidden group-hover:block">
                <div className="bg-white text-gray-800 rounded shadow-lg py-2 border border-gray-100">
                  {(session.user as any)?.role === 'ADMIN' && (
                    <>
                      <Link href="/admin/bookings" className="block px-4 py-2 hover:bg-gray-100 font-bold text-blue-600">
                        📋 Quản lý Đơn hàng
                      </Link>
                      <Link href="/admin/chat" className="block px-4 py-2 hover:bg-gray-100 font-bold text-blue-600">
                        💬 Quản lý Chat
                      </Link>
                    </>
                  )}
                  <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">👤 Trang cá nhân</Link>
                  <Link href="/bookings" className="block px-4 py-2 hover:bg-gray-100">Lịch sử đơn hàng</Link>
                  <button onClick={() => signOut()} className="w-full text-left block px-4 py-2 hover:bg-gray-100 text-red-600">
                    Đăng Xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link href="/auth/signin" className="hover:opacity-80">Đăng Nhập</Link>
              <Link href="/auth/register" className="hover:opacity-80">Đăng Ký</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}