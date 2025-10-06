<template>
  <div class="reset-password-page">
    <StarBackground />

    <div class="reset-password-container">
      <div class="reset-password-box">
        <h1 class="game-title">星河之怒</h1>
        <p class="game-subtitle">找回密码</p>

        <form @submit.prevent="handleResetPassword" class="reset-password-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="请输入注册时的邮箱"
              required
            />
          </div>

          <div class="form-group verification-group">
            <label for="verificationCode">验证码</label>
            <div class="verification-input">
              <input
                id="verificationCode"
                v-model="formData.verificationCode"
                type="text"
                placeholder="请输入6位验证码"
                required
                maxlength="6"
              />
              <button
                type="button"
                class="btn-code"
                @click="handleSendCode"
                :disabled="codeSending || countdown > 0"
              >
                {{ countdown > 0 ? `${countdown}秒后重发` : "发送验证码" }}
              </button>
            </div>
            <p class="hint">测试模式：任意6位数字均可通过验证</p>
          </div>

          <div class="form-group">
            <label for="newPassword">新密码</label>
            <input
              id="newPassword"
              v-model="formData.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              required
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认新密码</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              required
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? "重置中..." : "重置密码" }}
          </button>
        </form>

        <div class="reset-password-links">
          <router-link to="/login" class="link">返回登录</router-link>
          <span class="separator">|</span>
          <router-link to="/register" class="link">注册新账号</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { resetPassword, sendVerificationCode } from "../services/auth";
import StarBackground from "../components/StarBackground.vue";

const router = useRouter();

// 表单数据
const formData = ref({
  email: "",
  verificationCode: "",
  newPassword: "",
  confirmPassword: "",
});

const loading = ref(false);
const codeSending = ref(false);
const countdown = ref(0);
const errorMessage = ref("");
const successMessage = ref("");

/**
 * 发送验证码
 */
async function handleSendCode() {
  if (!formData.value.email) {
    errorMessage.value = "请先输入邮箱";
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";
  codeSending.value = true;

  try {
    const response = await sendVerificationCode({
      email: formData.value.email,
    });
    if (response.success) {
      successMessage.value = response.message;
      // 开始倒计时
      countdown.value = 60;
      const timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    } else {
      errorMessage.value = response.message;
    }
  } catch (error) {
    errorMessage.value = "发送验证码失败";
  } finally {
    codeSending.value = false;
  }
}

/**
 * 处理重置密码
 */
async function handleResetPassword() {
  errorMessage.value = "";
  successMessage.value = "";

  // 验证密码
  if (formData.value.newPassword !== formData.value.confirmPassword) {
    errorMessage.value = "两次输入的密码不一致";
    return;
  }

  if (formData.value.newPassword.length < 6) {
    errorMessage.value = "密码长度至少6位";
    return;
  }

  if (formData.value.verificationCode.length !== 6) {
    errorMessage.value = "请输入6位验证码";
    return;
  }

  loading.value = true;

  try {
    const response = await resetPassword({
      email: formData.value.email,
      verificationCode: formData.value.verificationCode,
      newPassword: formData.value.newPassword,
    });

    if (response.success) {
      successMessage.value = "密码重置成功！正在跳转到登录页...";

      // 延迟跳转
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      errorMessage.value = response.message;
    }
  } catch (error) {
    errorMessage.value = "密码重置失败，请稍后重试";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.reset-password-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.reset-password-container {
  position: relative;
  z-index: 1;
}

.reset-password-box {
  background: rgba(20, 30, 50, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: hidden;
}

.game-title {
  font-size: 36px;
  font-weight: 700;
  color: #4a90e2;
  text-align: center;
  margin-bottom: 8px;
  text-shadow: 0 0 20px rgba(74, 144, 226, 0.5);
}

.game-subtitle {
  font-size: 16px;
  color: #8fa3c1;
  text-align: center;
  margin-bottom: 30px;
  letter-spacing: 2px;
}

.reset-password-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #b0c4de;
  font-weight: 500;
}

.form-group input {
  padding: 12px 16px;
  background: rgba(10, 20, 40, 0.6);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  color: #e0e6f0;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 10px rgba(74, 144, 226, 0.3);
}

.form-group input::placeholder {
  color: #6b7b94;
}

.verification-group .verification-input {
  display: flex;
  gap: 10px;
}

.verification-group .verification-input input {
  flex: 1;
}

.btn-code {
  padding: 12px 16px;
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.4);
  border-radius: 6px;
  color: #4a90e2;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-code:hover:not(:disabled) {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4a90e2;
}

.btn-code:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  font-size: 12px;
  color: #8fa3c1;
  margin: 0;
}

.error-message {
  padding: 10px;
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.4);
  border-radius: 6px;
  color: #ff6b7a;
  font-size: 14px;
  text-align: center;
}

.success-message {
  padding: 10px;
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.4);
  border-radius: 6px;
  color: #5fd98a;
  font-size: 14px;
  text-align: center;
}

.btn-primary {
  padding: 14px;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5ba3f5 0%, #4a8bd0 100%);
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.4);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-password-links {
  margin-top: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.reset-password-links .link {
  color: #4a90e2;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.reset-password-links .link:hover {
  color: #5ba3f5;
  text-decoration: underline;
}

.reset-password-links .separator {
  color: #6b7b94;
}
</style>
