import React, { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { db, app } from '../firebase'
import FruitModal from './modal';
import { toast } from "react-toastify";
import { CiShoppingCart } from "react-icons/ci";
import { jsPDF } from "jspdf";

// Get the reference of the database.
const database = getDatabase(app);
const cartRef = ref(database, 'CanNang/');
const priceRef = ref(database, 'DonGia/')

// const cartRef = ref(database, 'CanNang/');
// const priceRef = ref(database, 'DonGia/')

const FruitPaymentSystem = () => {
    const URL = "https://raw.githubusercontent.com/thangdomanh/DoAn/main/mymodel/";
    let model, webcam, labelContainer, maxPredictions, fruitImage, price, fruitWeight, total;
    let webcamRef = useRef(null);
    let processing = false;

    // Get current date
    const currentDate = new Date().toLocaleDateString();

    // Format dd/mm/yyyy
    const formatDate = (date) => {
        const d = new Date(date);
        let month = "" + (d.getMonth() + 1);
        let day = "" + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;

        return [day, month, year].join("/");
    };


    // const [modelLoaded, setModelLoaded] = useState(false); // State để đánh dấu model đã được tải
    const webcamContainerRef = useRef();
    const labelContainerRef = useRef(null);
    const [modal, setModal] = useState(false);
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [fruitName, setFruitName] = useState('');
    const [fruitprice, setPrice] = useState(0);
    const [weight, setWeight] = useState(0);
    const [fruitImageSrc, setFruitImageSrc] = useState('');
    const [fruitImageAlt, setFruitImageAlt] = useState('');
    const [openCamera, setOpenCamera] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0);


    useEffect(() => {
        const init = async () => {
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";

            model = await tmImage.load(modelURL, metadataURL);
            maxPredictions = model.getTotalClasses();
        }

        init();
    }, []);

    const loop = async () => {
        if (webcamRef.current) {
            webcamRef.current.update();
            if (processing) {
                await predict();
            }
            window.requestAnimationFrame(loop);
        }
    };

    const handleOpenCamera = async () => {
        setOpenCamera(true);
        if (webcamRef.current) {
            await webcamRef.current.stop();
            webcamRef.current = null;
        }

        webcamRef.current = new tmImage.Webcam(400, 400, true);
        await webcamRef.current.setup();
        await webcamRef.current.play();
        webcamContainerRef.current.appendChild(webcamRef.current.canvas);
        loop();
    };

    const handleCloseCamera = async () => {
        setOpenCamera(false);
        if (webcamRef.current) {
            await webcamRef.current.stop();
            webcamRef.current = null;
        }
    };

    const predict = async () => {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        // labelContainer = document.getElementById("fruit-name");
        // price = document.getElementById('fruit-price')
        // fruitWeight = document.getElementById('fruit-weight')
        // total = document.getElementById('total')
        // fruitImage = document.getElementById('fruit-image')

        const prediction = await model.predict(webcamRef.current.canvas);
        let maxPrediction = 0;
        for (let i = 0; i < prediction.length; i++) {
            if (prediction[i].probability > maxPrediction) {
                maxPrediction = prediction[i].probability;
                // labelContainer.innerText = prediction[i].className;
                setFruitName(prediction[i].className);
            }
        }
        if (maxPrediction >= 0.90) {
            // labelContainer.innerText = fruitName;

            setFruitImageSrc(`./src/assets/image/${fruitName}.jpg`);
            setFruitImageAlt(fruitName);

            // Truy cập cơ sở dữ liệu Firebase để lấy giá tiền
            onValue(cartRef, (cartSnapshot) => {
                const cartData = cartSnapshot.val();
                if (cartData) {
                    console.log('Can nang:', cartData, 'gram');
                    setWeight(cartData); // Update state
                } else {
                    console.log('Cart data not found');
                }
            });

            onValue(priceRef, (priceSnapshot) => {
                const priceData = priceSnapshot.val();
                if (priceData) {
                    //get current fruitName
                    const fruitPrice = priceData[fruitName];
                    console.log('Price:', fruitPrice, 'VND');
                    if (fruitPrice) {
                        setPrice(fruitPrice); // Update state

                        // Calculate total
                        const totalPrice = (fruitPrice / 1000) * weight;
                        //convert totalPrice to 1,000 VND
                        setTotalPrice(totalPrice);

                        console.log('Total Price:', totalPrice.toLocaleString(), 'VND');
                    } else {
                        console.log(`No price found for ${labelContainer.innerText}`);
                    }
                } else {
                    console.log('Price data not found');
                }
            });

        } else {
            labelContainer.innerText = "nothing";
        }
    };


    const startProcessing = async () => {
        processing = true;

        // Xử lý 20 hình ảnh
        for (let i = 0; i < 2; i++) {
            // Gọi hàm predict để thực hiện dự đoán
            await predict();
        }

        // Tắt chế độ xử lý sau khi hoàn thành

        processing = false;
    };

    const handleAddCart = () => {
        console.log("Check label in handleAdd: ", fruitName);
        if (!fruitName) {
            toast.error('Vui lòng mở camera và chụp hình trước khi thêm vào giỏ hàng', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return;
        } else {
            // console.log('Check cart: ', );
            const item = {
                name: fruitName,
                price: fruitprice,
                weight: weight,
                total: totalPrice,
            };
            //check if item is already in cart
            const found = cart.find((element) => element.name === item.name);
            if (found) {
                //update quantity
                const newCart = cart.map((element) => {
                    if (element.name === item.name) {
                        return {
                            ...element,
                            weight: element.weight + item.weight,
                            total: element.total + item.total,
                        };
                    }
                    return element;
                });
                setCart(newCart);
            } else {
                setCart([...cart, item]);
            }
            setCartCount(cartCount + 1);



            console.log(cart);
            toast.success('Đã thêm vào giỏ hàng', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            //reset
            setFruitName('');
            setPrice(0);
            setWeight(0);
            setTotalPrice(0);
            setFruitImageSrc('');
            setFruitImageAlt('');

        }
    };

    const handleOpenModal = () => {
        console.log('Check cart in handleOpenModal: ', cart);
        setModal(true);
        console.log('Check modal in handleOpenModal: ', modal);
    }

    return (
        <div className='h-screen bg-slate-200 flex flex-row'>
            <FruitModal
                isOpen={modal}
                handleCloseModal={() => {
                    setModal(false);
                }}
                generatePDF={() => {

                    const doc = new jsPDF();
                    console.log(cartCount);

                    // Title
                    const titleText = "Invoice";
                    const titleWidth = doc.getStringUnitWidth(titleText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                    const centerX = (doc.internal.pageSize.width - titleWidth) / 2;
                    doc.setFontSize(18);
                    doc.text(titleText, centerX, 22);

                    // Line separator
                    doc.setLineWidth(0.2);
                    doc.line(14, 24, 196, 24);

                    // Invoice details
                    doc.setFontSize(12);
                    doc.text("Invoice Date:", 14, 30);

                    // Populate invoice details (dummy data used for demonstration)
                    const invoiceDetails = {
                        date: formatDate(currentDate),
                    };

                    doc.setFont("helvetica", "normal");
                    doc.text(invoiceDetails.date, 45, 30);

                    // Line separator
                    doc.setLineWidth(0.5);
                    doc.line(14, 35, 196, 35);

                    // Cart details
                    let yPosition = 44;
                    const xOffset = 14;
                    const yOffset = 6;

                    // Titles
                    doc.setFontSize(12);
                    doc.text("Product Name", xOffset, yPosition);
                    doc.text("Weight", xOffset + 50, yPosition);
                    doc.text("Price", xOffset + 80, yPosition);
                    doc.text("Total", xOffset + 110, yPosition);

                    yPosition += yOffset;

                    // Content
                    cart.forEach((item, index) => {
                        doc.text(item.name.toString(), xOffset, yPosition);
                        doc.text(item.weight.toString(), xOffset + 50, yPosition);
                        doc.text(item.price.toString(), xOffset + 80, yPosition);
                        doc.text(item.total.toString(), xOffset + 110, yPosition);
                        yPosition += yOffset; // Adjust spacing between rows
                    });

                    // Total
                    const total = cart.reduce((acc, item) => acc + item.total, 0);
                    doc.text("Total:", 80, yPosition + 10);
                    doc.text(total.toString(), 110, yPosition + 10);

                    // Save the PDF
                    doc.save("invoice.pdf");
                    toast.success("Invoice generated successfully!", {
                        position: "top-center",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    setModal(false);
                    setCartCount(0);
                    // Clear cart
                    setCart([]);
                }}
                cart={cart}
            />
            <div className='w-1/2 bg-white rounded m-2 flex flex-col justify-around'>
                {openCamera ? (
                    <>
                        <div id='webcam-container' className='h-5/6 rounded m-2 flex justify-around items-start' ref={webcamContainerRef}></div>
                        <div className='m-2 flex flex-row justify-around items-center'>
                            <button
                                onClick={handleCloseCamera}
                                className=' bg-violet-600 text-white p-2 rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'
                            >
                                {'Close Camera'}
                            </button>
                            <button
                                onClick={startProcessing}
                                className=' bg-violet-600 text-white p-2 rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'
                            >
                                {'Process Image'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div id='webcam-container' className='h-5/6 flex justify-center items-center text-md text-slate-400' >
                            Bấm nút để mở camera
                        </div>
                        <div className='m-2'>
                            <button
                                onClick={handleOpenCamera}
                                className='w-full bg-violet-600 text-white p-2 rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'
                            >
                                {'Open Camera'}
                            </button>
                        </div>
                    </>
                )}

            </div>
            <div className='w-1/2 flex flex-col bg-white m-2 rounded-md'>
                <div className='h-12 flex justify-end m-4'>
                    {/* <div className='flex justify-end items-center text-black bg-red-100 w-28 h-10 rounded-full'>
                        <button
                            onClick={() => {
                                setModal(true);
                            }}
                            className='flex items-center justify-center w-full h-full bg-red-200'
                        >
                            <span>{cartCount}</span>
                            <CiShoppingCart className='text-[30px] mr-2 text-gray-500' />
                        </button>
                    </div> */}

                </div>
                <div className='w-full flex flex-row'>
                    <div className='w-44 h-44 m-2 rounded-full flex justify-center items-center'>
                        <div id="fruit-image" alt="" className='h-36 w-36 border-2 border-slate-200 rounded-full flex justify-center items-center'>
                            <img src={fruitImageSrc} alt={fruitImageAlt} className='h/2/3 w-2/3 flex justify-center items-center object-cover' />
                        </div>
                    </div>
                    <div className='w-2/3 flex flex-col'>
                        <button
                            onClick={handleOpenModal}
                            className='flex items-center justify-center w-full h-full bg-red-200'
                        >
                            <span>{cartCount}</span>
                            <CiShoppingCart className='text-[30px] mr-2 text-gray-500' />
                        </button>
                        <div className='rounded m-2 mb-1 flex flex-col'>
                            <div className='p-3 border-b-2 border-slate-400 m-2'>
                                <span className='text-left text-lg font-semibold'>Product Information</span>
                            </div>
                            <div className='flex flex-row text-center mb-5'>
                                <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Product Name</div>
                                <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Weight</div>
                                <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Price</div>
                                <div className='w-1/3 text-slate-400 text-sm font-semibold uppercase'>Total</div>
                            </div>
                            <div className='flex flex-row text-center'>
                                <label id="fruit-name" className='w-1/3'>{fruitName}</label>
                                <div id='fruit-weight' className='w-1/3'>{weight.toLocaleString()} gram</div>
                                <div id='fruit-price' className='w-1/3'>{fruitprice.toLocaleString()} VND</div>
                                <div id='total' className='w-1/3'>{(fruitprice * weight / 1000).toLocaleString()} VND</div>
                            </div>

                            <div className='flex justify-end mt-3'>
                                <div className='flex justify-end mt-3'>
                                    <button
                                        onClick={handleAddCart}
                                        className='bg-violet-600 text-white p-2 rounded hover:bg-violet-900 hover:shadow-xl transition duration-500'
                                    >
                                        Add to cart
                                    </button>
                                    {/* {cartCount} */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FruitPaymentSystem;
