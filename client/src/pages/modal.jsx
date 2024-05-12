import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle } from "react-icons/fi";
import { CiShoppingCart } from "react-icons/ci";

import { toast } from "react-toastify";


const FruitModal = ({ openCamera, cart, cartCount }) => {
    const [isOpen, setIsOpen] = useState(false);
    console.log("check cartt: ", cart);
    console.log("check cartCount: ", cartCount);

    return (
        <>
            <div className='flex justify-end items-center text-black bg-red-100 w-28 h-10 rounded-full'
            >
                <button
                    onClick={() => {
                        setIsOpen(true);
                    }}
                    className='flex items-center justify-center w-full h-full bg-red-200'
                >
                    <span>{cartCount}</span>
                    <CiShoppingCart className='text-[30px] mr-2 text-gray-500' />
                </button>
            </div>
            <SpringModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                labelContainerRef={openCamera}
                cart={cart}
            />
        </>
    );
};

const SpringModal = ({ isOpen, setIsOpen, cart }) => {
    console.log(cart);
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className=" backdrop-blur p-8 fixed inset-0 z-50 grid place-items-center overflow-y-scroll cursor-pointer"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: "12.5deg" }}
                        animate={{ scale: 1, rotate: "0deg" }}
                        exit={{ scale: 0, rotate: "0deg" }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-6 rounded-lg w-full max-w-lg shadow-xl cursor-default relative overflow-hidden"
                    >
                        <FiAlertCircle className="text-white/10 rotate-12 text-[250px] absolute z-0 -top-24 -left-24" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-center mb-6 border-b-2 pb-2">
                                Thông tin sản phẩm
                            </h3>
                            {cart.length > 0 ? (
                                cart.map((item, index) => (
                                    <>
                                        <p key={index} className="text-left mb-1">
                                            Tên sản phẩm: {item.name}
                                        </p>
                                        <p key={index} className="text-left mb-1">
                                            Cân nặng: {item.weight}
                                        </p>
                                        <p key={index} className="text-left mb-1">
                                            Giá: {item.price}
                                        </p>
                                        <p key={index} className="text-left mb-1">
                                            Thành tiền: {item.total}
                                        </p>
                                    </>
                                ))
                            ) : (
                                <p className="text-left mb-1">Không có sản phẩm trong giỏ hàng</p>
                            )}


                            <p className="text-left mb-1 pb-3 border-b-2">
                                {/* Cân nặng: {cart.weight} (Kg) */}
                            </p>
                            <p className="text-left text-xl mb-1 font-semibold">
                                {/* Thành tiền: {cart.total} (VND) */}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="bg-transparent hover:bg-white/10 transition-colors text-white font-semibold w-full py-2 rounded"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="bg-white hover:opacity-90 transition-opacity text-indigo-600 font-semibold w-full py-2 rounded"
                                >
                                    Thanh toán
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FruitModal;