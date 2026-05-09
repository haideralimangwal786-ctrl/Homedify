import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import UserLayout from '../shared/UserLayout'
import { CartContext } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../shared/ProductCard'
import { 
    Typography, Button, Empty, Row, Col, Card
} from 'antd'
import {
    Heart, ArrowRight
} from 'lucide-react'

const { Text } = Typography

const UserWishlist = () => {
    const { items } = useWishlist()
    const navigate = useNavigate()

    return (
        <UserLayout>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                <div className="flex justify-end mb-10">
                    <Button 
                        type="text" 
                        onClick={() => navigate('/shop')}
                        className="text-coral font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-coral/5 rounded-xl h-12 px-6"
                    >
                        Explore Shop <ArrowRight size={14} />
                    </Button>
                </div>

                {items.length > 0 ? (
                    <Row gutter={[24, 24]}>
                        {items.map(p => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={p._id}>
                                <ProductCard product={p} />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden py-24 text-center">
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <div className="mt-6 max-w-sm mx-auto">
                                    <Text className="text-xl font-black text-gray-900 block tracking-tight">Your Wishlist is Empty</Text>
                                    <Text className="text-gray-400 font-medium text-sm mt-2 block">
                                        Heart products you love in the artisan shop and they'll appear here for your future collection.
                                    </Text>
                                    <Button 
                                        type="primary" 
                                        className="bg-gray-900 border-none rounded-2xl h-14 px-12 mt-10 font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-gray-200"
                                        onClick={() => navigate('/shop')}
                                    >
                                        Start Your Collection
                                    </Button>
                                </div>
                            }
                        />
                    </Card>
                )}
            </div>
        </UserLayout>
    )
}

export default UserWishlist
