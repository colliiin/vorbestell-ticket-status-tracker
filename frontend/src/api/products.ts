import { request } from "./client";
import type { ProductCreateInput, ProductListResponse, ProductUpdateInput, PublicProduct, StaffProduct } from "../types/api";

export const getProducts = () => request<PublicProduct[]>("/api/products");

export const getStaffProducts = (params: URLSearchParams) => {
  const query = params.toString();
  return request<ProductListResponse>(`/api/staff/products${query ? `?${query}` : ""}`);
};

export const getStaffProduct = (id: string | number) => request<StaffProduct>(`/api/staff/products/${id}`);

export const createProduct = (body: ProductCreateInput) => request<StaffProduct>("/api/staff/products", { method: "POST", csrf: true, body: JSON.stringify(body) });

export const updateProduct = (id: string | number, body: ProductUpdateInput) => request<StaffProduct>(`/api/staff/products/${id}`, { method: "PATCH", csrf: true, body: JSON.stringify(body) });
