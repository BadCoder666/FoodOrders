from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from contextlib import asynccontextmanager
from typing import Optional
from pydantic import BaseModel, EmailStr

from database import create_tables, get_db
from models import User, Order
from parser import parse_order_message
from auth import hash_password, verify_password, create_access_token, get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(title="Food Order Logs API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth schemas ─────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ── Order schemas ─────────────────────────────────────────────────────────────

class ParseRequest(BaseModel):
    message: str


class OrderCreate(BaseModel):
    menu_name: Optional[str] = None
    customer_name: Optional[str] = None
    phone_no: Optional[str] = None
    dish_ordered: Optional[str] = None
    quantity: Optional[int] = None
    order_amount: Optional[float] = None
    payment_status: Optional[str] = "Pending"
    raw_message: Optional[str] = None


class OrderUpdate(BaseModel):
    payment_status: Optional[str] = None
    menu_name: Optional[str] = None
    customer_name: Optional[str] = None
    phone_no: Optional[str] = None
    dish_ordered: Optional[str] = None
    quantity: Optional[int] = None
    order_amount: Optional[float] = None


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/api/auth/signup")
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=body.email.lower(), hashed_password=hash_password(body.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.email)
    return {"token": token, "user": {"id": user.id, "email": user.email}}


@app.post("/api/auth/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id, user.email)
    return {"token": token, "user": {"id": user.id, "email": user.email}}


# ── Order endpoints ───────────────────────────────────────────────────────────

@app.post("/api/parse")
async def parse_order(request: ParseRequest, current_user: User = Depends(get_current_user)):
    try:
        parsed = parse_order_message(request.message)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse order: {str(e)}")


@app.post("/api/orders")
async def create_order(
    order_data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        valid_statuses = ["Paid", "Unpaid", "Pending"]
        payment_status = order_data.payment_status
        if payment_status not in valid_statuses:
            payment_status = "Pending"

        order = Order(
            user_id=current_user.id,
            menu_name=order_data.menu_name,
            customer_name=order_data.customer_name,
            phone_no=order_data.phone_no,
            dish_ordered=order_data.dish_ordered,
            quantity=order_data.quantity,
            order_amount=order_data.order_amount,
            payment_status=payment_status,
            raw_message=order_data.raw_message,
        )
        db.add(order)
        await db.commit()
        await db.refresh(order)
        return order.to_dict()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save order: {str(e)}")


@app.get("/api/orders")
async def get_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await db.execute(
            select(Order)
            .where(Order.user_id == current_user.id)
            .order_by(desc(Order.created_at))
        )
        orders = result.scalars().all()
        return [order.to_dict() for order in orders]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch orders: {str(e)}")


@app.put("/api/orders/{order_id}")
async def update_order(
    order_id: int,
    update_data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await db.execute(
            select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
        )
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        update_dict = update_data.model_dump(exclude_unset=True)

        valid_statuses = ["Paid", "Unpaid", "Pending"]
        if "payment_status" in update_dict and update_dict["payment_status"] not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid payment status")

        for field, value in update_dict.items():
            setattr(order, field, value)

        await db.commit()
        await db.refresh(order)
        return order.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update order: {str(e)}")


@app.delete("/api/orders/{order_id}")
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await db.execute(
            select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
        )
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        await db.delete(order)
        await db.commit()
        return {"message": "Order deleted successfully", "id": order_id}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete order: {str(e)}")
