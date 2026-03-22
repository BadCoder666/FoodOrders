from sqlalchemy import Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    orders: Mapped[list["Order"]] = relationship("Order", back_populates="user")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    menu_name: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone_no: Mapped[str | None] = mapped_column(String, nullable=True)
    dish_ordered: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True, default=1)
    order_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    payment_status: Mapped[str | None] = mapped_column(String, nullable=True, default="Pending")
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
    raw_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="orders")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "menu_name": self.menu_name,
            "customer_name": self.customer_name,
            "phone_no": self.phone_no,
            "dish_ordered": self.dish_ordered,
            "quantity": self.quantity,
            "order_amount": self.order_amount,
            "payment_status": self.payment_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "raw_message": self.raw_message,
        }
