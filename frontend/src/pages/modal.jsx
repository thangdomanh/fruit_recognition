import React, { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle } from "react-icons/fi";
import { CiShoppingCart } from "react-icons/ci";

const FruitModal = ({ isOpen, handleCloseModal, generatePDF, cart }) => {
    const targetRef = useRef();
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-[350px] w-[550px] p-8 mx-auto my-auto fixed inset-0 z-50 grid place-items-center cursor-pointer"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: "12.5deg" }}
                        animate={{ scale: 1, rotate: "0deg" }}
                        exit={{ scale: 0, rotate: "0deg" }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-6 rounded-lg w-full max-w-lg shadow-xl cursor-default relative overflow-hidden"
                        ref={targetRef}
                    >
                        <FiAlertCircle className="text-white/10 rotate-12 text-[250px] absolute z-0 -top-24 -left-24" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-center mb-6 border-b-2 pb-2">
                                Product Information
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                                <CiShoppingCart className="text-4xl" />
                                <p className="text-2xl font-semibold">Cart</p>
                            </div>
                            {cart.length > 0 ? (
                                cart.map((item, index) => (
                                    <div key={index}>
                                        <p className="text-left mb-1">
                                            Product Name: {item.name}
                                        </p>
                                        <p className="text-left mb-1">
                                            Weight: {item.weight}
                                        </p>
                                        <p className="text-left mb-1">
                                            Price: {item.price}
                                        </p>
                                        <p className="text-left mb-1">
                                            Total: {item.total}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-left mb-1">There are no items in the cart.</p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCloseModal}
                                    className="bg-transparent hover:bg-white/10 transition-colors text-white font-semibold w-full py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={generatePDF}
                                    className="bg-white hover:opacity-90 transition-opacity text-indigo-600 font-semibold w-full py-2 rounded"
                                >
                                    Checkout
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
